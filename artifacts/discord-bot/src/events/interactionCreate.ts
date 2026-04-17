import {
  Interaction,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { ExtendedClient } from "../types";
import { pool } from "../database";
import { HELP_CATEGORIES } from "../commands/utility/help";
import { createTicketChannel } from "../commands/tickets/ticket";
import { activeGames as bjGames, drawCard, handValue, displayHand } from "../commands/fun/blackjack";
import { activeGames as tttGames } from "../commands/fun/tictactoe";
import { getQueue } from "../handlers/musicPlayer";

const PRIORITY_COLORS: Record<string, number> = {
  low: 0x00ff88, medium: 0x5865f2, high: 0xff8800, urgent: 0xff0000,
};
const PRIORITY_EMOJIS: Record<string, string> = {
  low: "🟢", medium: "🔵", high: "🟠", urgent: "🔴",
};

function ticketActionRow(claimed = false, closed = false) {
  const buttons: ButtonBuilder[] = [];

  if (!closed) {
    buttons.push(
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    );

    if (claimed) {
      buttons.push(new ButtonBuilder().setCustomId("ticket_unclaim_btn").setLabel("📌 Unclaim").setStyle(ButtonStyle.Secondary));
    } else {
      buttons.push(new ButtonBuilder().setCustomId("ticket_claim_btn").setLabel("📌 Claim").setStyle(ButtonStyle.Secondary));
    }

    buttons.push(new ButtonBuilder().setCustomId("ticket_transcript_btn").setLabel("📄 Transcript").setStyle(ButtonStyle.Primary));
    buttons.push(new ButtonBuilder().setCustomId("ticket_add_btn").setLabel("➕ Add User").setStyle(ButtonStyle.Success));
  } else {
    buttons.push(
      new ButtonBuilder().setCustomId("ticket_reopen_btn").setLabel("🔓 Reopen").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_transcript_btn").setLabel("📄 Transcript").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_delete_btn").setLabel("🗑️ Delete").setStyle(ButtonStyle.Danger),
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

export async function onInteractionCreate(client: ExtendedClient, interaction: Interaction) {
  // ── SLASH COMMANDS ─────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error: any) {
      console.error(`[Commands] Error in ${interaction.commandName}:`, error);
      const embed = new EmbedBuilder().setColor(0xff0000).setTitle("❌ Error")
        .setDescription("Something went wrong. Please try again.");
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // ── MODALS ─────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    const id = interaction.customId;

    // Ticket Creation Modal
    if (id === "ticket_create_modal") {
      const topic = interaction.fields.getTextInputValue("ticket_topic") || "No topic";
      const priority = interaction.fields.getTextInputValue("ticket_priority").toLowerCase();
      const validPriority = ["low", "medium", "high", "urgent"].includes(priority) ? priority : "medium";

      const config = await pool.query("SELECT * FROM ticket_settings WHERE guild_id = $1", [interaction.guild!.id]);
      if (!config.rows.length) return interaction.reply({ content: "❌ Ticket system not configured.", ephemeral: true });
      const cfg = config.rows[0];

      const existing = await pool.query(
        "SELECT COUNT(*) FROM tickets WHERE user_id = $1 AND guild_id = $2 AND status = 'open'",
        [interaction.user.id, interaction.guild!.id]
      );
      const maxTickets = cfg.max_tickets ?? 1;
      if (parseInt(existing.rows[0].count) >= maxTickets) {
        return interaction.reply({ content: `❌ You already have **${existing.rows[0].count}** open ticket(s). Max is **${maxTickets}**.`, ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });
      const ch = await createTicketChannel(interaction.guild!, interaction.user.id, topic, cfg, validPriority);
      return interaction.editReply({ content: `✅ Your ticket has been created: ${ch}` });
    }

    return;
  }

  // ── SELECT MENUS ────────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "help_category") {
      const selected = interaction.values[0];
      const category = HELP_CATEGORIES[selected];
      if (!category) return;
      const embed = new EmbedBuilder()
        .setColor(category.color)
        .setTitle(`${category.emoji} ${category.name}`)
        .setDescription(`**${category.commands.length} commands available**\n${"─".repeat(30)}`)
        .addFields(category.commands.map((c: any) => ({ name: `\`/${c.name}\``, value: c.desc, inline: true })))
        .setFooter({ text: "RYZENX™ • Use /commandname to run" })
        .setTimestamp();
      await interaction.update({ embeds: [embed] });
    }

    // Music player button controls via select menu (future)
    return;
  }

  // ── BUTTONS ─────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const id = interaction.customId;

    // ─────────── TICKET BUTTONS ───────────────────────────────────

    if (id === "ticket_create_btn") {
      const modal = new ModalBuilder()
        .setCustomId("ticket_create_modal")
        .setTitle("🎫 Open a Support Ticket");

      const topicInput = new TextInputBuilder()
        .setCustomId("ticket_topic")
        .setLabel("What is your ticket about?")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Describe your issue in detail...")
        .setRequired(false)
        .setMaxLength(500);

      const priorityInput = new TextInputBuilder()
        .setCustomId("ticket_priority")
        .setLabel("Priority: low / medium / high / urgent")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("medium")
        .setRequired(false)
        .setMaxLength(6);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(topicInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(priorityInput),
      );

      return interaction.showModal(modal);
    }

    if (id === "ticket_close") {
      const ticket = await pool.query("SELECT * FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const ch = interaction.channel as TextChannel;
      const t = ticket.rows[0];

      await pool.query("UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE channel_id = $1", [interaction.channelId]);
      await ch.permissionOverwrites.edit(t.user_id, { SendMessages: false }).catch(() => {});

      const priority = t.priority || "medium";
      const pEmoji = PRIORITY_EMOJIS[priority] || "🔵";
      const pColor = PRIORITY_COLORS[priority] || 0x5865f2;

      const embed = new EmbedBuilder()
        .setColor(pColor)
        .setTitle("🔒 Ticket Closed")
        .addFields(
          { name: "🔒 Closed By", value: interaction.user.tag, inline: true },
          { name: "👤 Ticket Owner", value: `<@${t.user_id}>`, inline: true },
          { name: `${pEmoji} Priority`, value: priority, inline: true },
          { name: "📋 Topic", value: t.topic || "None", inline: false },
        )
        .setFooter({ text: "RYZENX™ Ticket System" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], components: [ticketActionRow(false, true)] });
    }

    if (id === "ticket_claim_btn") {
      const ticket = await pool.query("SELECT * FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });

      await pool.query("UPDATE tickets SET claimed_by = $1 WHERE channel_id = $2", [interaction.user.id, interaction.channelId]);

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("📌 Ticket Claimed")
        .setDescription(`**${interaction.user.tag}** is now handling this ticket.`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: "RYZENX™ Ticket System" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], components: [ticketActionRow(true, false)] });
    }

    if (id === "ticket_unclaim_btn") {
      await pool.query("UPDATE tickets SET claimed_by = NULL WHERE channel_id = $1", [interaction.channelId]);
      const embed = new EmbedBuilder()
        .setColor(0xff8800)
        .setDescription("📌 Ticket **unclaimed** — available for staff to pick up.")
        .setFooter({ text: "RYZENX™ Ticket System" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], components: [ticketActionRow(false, false)] });
    }

    if (id === "ticket_reopen_btn") {
      const ticket = await pool.query("SELECT user_id FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const ch = interaction.channel as TextChannel;
      await pool.query("UPDATE tickets SET status = 'open', closed_at = NULL WHERE channel_id = $1", [interaction.channelId]);
      await ch.permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: true }).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setTitle("🔓 Ticket Reopened").setDescription("This ticket has been reopened. Staff will assist you shortly.").setTimestamp()], components: [ticketActionRow(false, false)] });
    }

    if (id === "ticket_transcript_btn") {
      await interaction.deferReply({ ephemeral: true });
      const ch = interaction.channel as TextChannel;
      const messages = await ch.messages.fetch({ limit: 100 });
      const sorted = [...messages.values()].reverse();
      const lines = sorted.map((m) => {
        const ts = new Date(m.createdTimestamp).toISOString();
        const content = m.content || (m.embeds.length ? "[Embed]" : m.attachments.size ? "[Attachment]" : "");
        return `[${ts}] ${m.author.tag}: ${content}`;
      });
      const text = `RYZENX™ Ticket Transcript\nChannel: ${ch.name}\nDate: ${new Date().toISOString()}\n${"─".repeat(60)}\n${lines.join("\n")}`;
      const buffer = Buffer.from(text, "utf-8");
      return interaction.editReply({
        content: "📄 Ticket transcript saved!",
        files: [{ attachment: buffer, name: `transcript-${ch.name}.txt` }],
      });
    }

    if (id === "ticket_add_btn") {
      return interaction.reply({
        content: "To add a user to this ticket, use the command:\n`/ticket add @user`",
        ephemeral: true,
      });
    }

    if (id === "ticket_delete_btn") {
      await pool.query("DELETE FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      await interaction.reply({ content: "🗑️ Deleting this ticket in 3 seconds...", ephemeral: true });
      setTimeout(() => (interaction.channel as TextChannel).delete().catch(() => {}), 3000);
      return;
    }

    // ─────────── MUSIC BUTTONS ────────────────────────────────────

    if (id === "music_skip" || id === "music_pause" || id === "music_resume" || id === "music_stop" || id === "music_queue") {
      const queue = getQueue(interaction.guildId!);
      if (!queue) return interaction.reply({ content: "❌ No music is playing.", ephemeral: true });

      if (id === "music_skip") {
        const title = queue.currentTrack?.title ?? "Unknown";
        queue.player.stop();
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`⏭️ Skipped **${title.substring(0, 80)}**`)] });
      }
      if (id === "music_pause") {
        queue.player.pause();
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xffaa00).setDescription("⏸️ Playback **paused**.")] });
      }
      if (id === "music_resume") {
        queue.player.unpause();
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription("▶️ Playback **resumed**.")] });
      }
      if (id === "music_stop") {
        const { destroyQueue } = await import("../handlers/musicPlayer");
        destroyQueue(interaction.guildId!);
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("⏹️ Stopped and queue cleared.")] });
      }
      if (id === "music_queue") {
        const all = queue.currentTrack ? [queue.currentTrack, ...queue.tracks] : queue.tracks;
        if (!all.length) return interaction.reply({ content: "📭 Queue is empty.", ephemeral: true });
        const lines = all.slice(0, 10).map((t, i) => {
          const label = i === 0 && queue.currentTrack ? "▶️" : `${i}.`;
          return `${label} **${t.title.substring(0, 50)}** \`${t.duration}\``;
        });
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle(`🎵 Queue — ${all.length} track(s)`).setDescription(lines.join("\n")).setFooter({ text: "RYZENX™ Music" })], ephemeral: true });
      }
    }

    // ─────────── BLACKJACK BUTTONS ────────────────────────────────

    if (id === "bj_hit" || id === "bj_stand") {
      const key = `${interaction.user.id}-${interaction.guildId}`;
      const game = bjGames.get(key);
      if (!game) return interaction.reply({ content: "❌ No active Blackjack game.", ephemeral: true });

      if (id === "bj_hit") {
        const card = drawCard();
        game.playerHand.push(card);
        const playerVal = handValue(game.playerHand);

        if (playerVal > 21) {
          bjGames.delete(key);
          return interaction.update({
            embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("🃏 Blackjack — 💥 Bust!")
              .setDescription(`Your hand: ${displayHand(game.playerHand)} = **${playerVal}**\n💸 Lost **🪙 ${game.bet.toLocaleString()}**!`).setTimestamp()],
            components: [],
          });
        }

        if (playerVal === 21) {
          let dealerVal = handValue(game.dealerHand);
          while (dealerVal < 17) { game.dealerHand.push(drawCard()); dealerVal = handValue(game.dealerHand); }
          bjGames.delete(key);
          const won = dealerVal > 21 || playerVal > dealerVal;
          const net = won ? game.bet : (playerVal === dealerVal ? 0 : -game.bet);
          await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [net, interaction.user.id, interaction.guildId]);
          return interaction.update({
            embeds: [new EmbedBuilder().setColor(won ? 0xffd700 : playerVal === dealerVal ? 0xffff00 : 0xff0000)
              .setTitle(`🃏 Blackjack — ${won ? "🎉 You Win!" : playerVal === dealerVal ? "🤝 Tie!" : "💸 Dealer Wins!"}`)
              .addFields(
                { name: "🧑 Your Hand", value: `${displayHand(game.playerHand)} = **${playerVal}**`, inline: true },
                { name: "🤖 Dealer", value: `${displayHand(game.dealerHand)} = **${dealerVal}**`, inline: true },
              ).setTimestamp()],
            components: [],
          });
        }

        const { ActionRowBuilder: AR2, ButtonBuilder: BB2, ButtonStyle: BS2 } = await import("discord.js");
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🃏 Blackjack")
            .addFields(
              { name: "🧑 Your Hand", value: `${displayHand(game.playerHand)} = **${playerVal}**`, inline: true },
              { name: "🤖 Dealer", value: `${displayHand([game.dealerHand[0]])} ❓`, inline: true },
              { name: "💰 Bet", value: `🪙 ${game.bet.toLocaleString()}`, inline: true },
            ).setTimestamp()],
          components: [new AR2<any>().addComponents(
            new BB2().setCustomId("bj_hit").setLabel("🎯 Hit").setStyle(BS2.Primary),
            new BB2().setCustomId("bj_stand").setLabel("✋ Stand").setStyle(BS2.Secondary),
          )],
        });
      }

      if (id === "bj_stand") {
        let dealerVal = handValue(game.dealerHand);
        while (dealerVal < 17) { game.dealerHand.push(drawCard()); dealerVal = handValue(game.dealerHand); }
        const playerVal = handValue(game.playerHand);
        bjGames.delete(key);
        const won = dealerVal > 21 || playerVal > dealerVal;
        const tie = playerVal === dealerVal;
        const net = won ? game.bet : (tie ? 0 : -game.bet);
        await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [net, interaction.user.id, interaction.guildId]);
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(won ? 0x00ff88 : tie ? 0xffff00 : 0xff0000)
            .setTitle(`🃏 Blackjack — ${won ? "🎉 You Win!" : tie ? "🤝 Tie!" : "💸 Dealer Wins!"}`)
            .addFields(
              { name: "🧑 Your Hand", value: `${displayHand(game.playerHand)} = **${playerVal}**`, inline: true },
              { name: "🤖 Dealer", value: `${displayHand(game.dealerHand)} = **${dealerVal}**`, inline: true },
              { name: won ? "💵 Won" : tie ? "↩️ Returned" : "💸 Lost", value: `🪙 ${Math.abs(net).toLocaleString()}`, inline: true },
            ).setTimestamp()],
          components: [],
        });
      }
    }

    // ─────────── TIC-TAC-TOE ─────────────────────────────────────

    if (id.startsWith("ttt_")) {
      const parts = id.split("_");
      const idx = parseInt(parts[1]);
      const gameKey = parts.slice(2).join("_");
      const game = tttGames.get(gameKey);
      if (!game) return interaction.reply({ content: "❌ Game not found.", ephemeral: true });

      const currentPlayerId = game.players[game.current];
      if (interaction.user.id !== currentPlayerId) return interaction.reply({ content: "❌ It's not your turn!", ephemeral: true });
      if (game.board[idx]) return interaction.reply({ content: "❌ That cell is taken!", ephemeral: true });

      const sym = game.symbols[game.current];
      game.board[idx] = sym;
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const win = wins.some((w) => w.every((i) => game.board[i] === sym));
      const draw = !win && game.board.every(Boolean);

      const p1 = `<@${game.players[0]}>`, p2 = `<@${game.players[1]}>`;
      const { ActionRowBuilder: AR3, ButtonBuilder: BB3, ButtonStyle: BS3 } = await import("discord.js");
      const buildComponents = (disabled = false) =>
        [0, 3, 6].map((row) =>
          new AR3<any>().addComponents(
            [0, 1, 2].map((col) => {
              const i = row + col;
              return new BB3()
                .setCustomId(`ttt_${i}_${gameKey}`)
                .setLabel(game.board[i] || "·")
                .setStyle(game.board[i] === "X" ? BS3.Danger : game.board[i] === "O" ? BS3.Primary : BS3.Secondary)
                .setDisabled(!!game.board[i] || disabled);
            })
          )
        );

      if (win) {
        tttGames.delete(gameKey);
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xffd700).setTitle("❌⭕ Tic-Tac-Toe — 🏆 Winner!")
            .setDescription(`**${sym === "X" ? p1 : p2}** wins as ${sym === "X" ? "❌" : "⭕"}!`).setTimestamp()],
          components: buildComponents(true),
        });
      }
      if (draw) {
        tttGames.delete(gameKey);
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xffff00).setTitle("❌⭕ Tic-Tac-Toe — 🤝 Draw!").setDescription("Well played!").setTimestamp()],
          components: buildComponents(true),
        });
      }

      game.current = game.current === 0 ? 1 : 0;
      return interaction.update({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("❌⭕ Tic-Tac-Toe")
          .setDescription(`${p1} ❌ vs ${p2} ⭕\n\n<@${game.players[game.current]}>'s turn!`).setTimestamp()],
        components: buildComponents(),
      });
    }

    return;
  }
}
