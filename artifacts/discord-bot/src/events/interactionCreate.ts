import {
  Interaction,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { ExtendedClient } from "../types";
import { pool } from "../database";
import { HELP_CATEGORIES } from "../commands/utility/help";
import { createTicketChannel } from "../commands/tickets/ticket";
import { activeGames as bjGames, drawCard, handValue, displayHand } from "../commands/fun/blackjack";
import { activeGames as tttGames } from "../commands/fun/tictactoe";

export async function onInteractionCreate(client: ExtendedClient, interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error: any) {
      console.error(`[Commands] Error executing ${interaction.commandName}:`, error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ Error")
        .setDescription("An error occurred while executing this command. Please try again.")
        .setTimestamp();
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "help_category") {
      const selected = interaction.values[0];
      const category = HELP_CATEGORIES[selected];
      if (!category) return;

      const embed = new EmbedBuilder()
        .setColor(category.color)
        .setTitle(`${category.emoji} ${category.name}`)
        .setDescription(`**${category.commands.length} commands available**\n${"─".repeat(30)}`)
        .addFields(
          category.commands.map((c: any) => ({
            name: `\`/${c.name}\``,
            value: c.desc,
            inline: true,
          }))
        )
        .setFooter({ text: "RYZENX™ Ultra-Advanced Bot • Use /commandname to run" })
        .setTimestamp();

      await interaction.update({ embeds: [embed] });
    }
    return;
  }

  if (interaction.isButton()) {
    const id = interaction.customId;

    // ─── GIVEAWAY ───────────────────────────────────────────
    if (id.startsWith("giveaway_enter_")) {
      const giveawayId = id.replace("giveaway_enter_", "");
      const gw = await pool.query("SELECT * FROM giveaways WHERE id = $1 AND ended = false", [giveawayId]);
      if (!gw.rows.length) return interaction.reply({ content: "❌ This giveaway has already ended.", ephemeral: true });

      const already = await pool.query("SELECT id FROM giveaway_entries WHERE giveaway_id = $1 AND user_id = $2", [giveawayId, interaction.user.id]);
      if (already.rows.length) return interaction.reply({ content: "⚠️ You're already entered in this giveaway!", ephemeral: true });

      await pool.query("INSERT INTO giveaway_entries (giveaway_id, user_id) VALUES ($1, $2)", [giveawayId, interaction.user.id]);
      const countRes = await pool.query("SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = $1", [giveawayId]);
      return interaction.reply({ content: `🎉 Entered **${gw.rows[0].prize}**! Total entries: **${countRes.rows[0].count}**`, ephemeral: true });
    }

    // ─── TICKET BUTTONS ─────────────────────────────────────
    if (id === "ticket_create_btn") {
      const config = await pool.query("SELECT * FROM ticket_settings WHERE guild_id = $1", [interaction.guild!.id]);
      if (!config.rows.length) return interaction.reply({ content: "❌ Ticket system not configured by an admin.", ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const ch = await createTicketChannel(interaction.guild!, interaction.user.id, null, config.rows[0]);
      return interaction.editReply({ content: `✅ Your ticket has been created: ${ch}` });
    }

    if (id === "ticket_close") {
      const ticket = await pool.query("SELECT * FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const ch = interaction.channel as TextChannel;
      await pool.query("UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE channel_id = $1", [interaction.channelId]);
      await ch.permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: false }).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("🔒 Ticket Closed").setDescription(`Closed by **${interaction.user.tag}**`).setTimestamp()] });
    }

    if (id === "ticket_claim_btn") {
      await pool.query("UPDATE tickets SET claimed_by = $1 WHERE channel_id = $2", [interaction.user.id, interaction.channelId]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`📌 Ticket claimed by **${interaction.user.tag}**`)] });
    }

    if (id === "ticket_reopen_btn") {
      const ticket = await pool.query("SELECT user_id FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const ch = interaction.channel as TextChannel;
      await pool.query("UPDATE tickets SET status = 'open', closed_at = NULL WHERE channel_id = $1", [interaction.channelId]);
      await ch.permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: true }).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription("🔓 Ticket **reopened**!")] });
    }

    if (id === "ticket_delete_btn") {
      await pool.query("DELETE FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      await interaction.reply({ content: "🗑️ Deleting in 3 seconds...", ephemeral: true });
      setTimeout(() => (interaction.channel as TextChannel).delete().catch(() => {}), 3000);
      return;
    }

    // ─── BLACKJACK ──────────────────────────────────────────
    if (id === "bj_hit" || id === "bj_stand") {
      const key = `${interaction.user.id}-${interaction.guildId}`;
      const game = bjGames.get(key);
      if (!game) return interaction.reply({ content: "❌ No active Blackjack game found.", ephemeral: true });

      if (id === "bj_hit") {
        const card = drawCard();
        game.playerHand.push(card);
        const playerVal = handValue(game.playerHand);

        if (playerVal > 21) {
          bjGames.delete(key);
          return interaction.update({
            embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("🃏 Blackjack — 💥 Bust!").setDescription(`Your hand: ${displayHand(game.playerHand)} = **${playerVal}**\n\n💸 You busted and lost **🪙 ${game.bet.toLocaleString()}**!`).setTimestamp()],
            components: [],
          });
        }

        if (playerVal === 21) {
          // Auto stand at 21
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

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import("discord.js");
        const row = new ActionRowBuilder<any>().addComponents(
          new ButtonBuilder().setCustomId("bj_hit").setLabel("🎯 Hit").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("bj_stand").setLabel("✋ Stand").setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🃏 Blackjack")
            .addFields(
              { name: "🧑 Your Hand", value: `${displayHand(game.playerHand)} = **${playerVal}**`, inline: true },
              { name: "🤖 Dealer", value: `${displayHand([game.dealerHand[0]])} ❓`, inline: true },
              { name: "💰 Bet", value: `🪙 ${game.bet.toLocaleString()}`, inline: true },
            ).setTimestamp()],
          components: [row],
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

    // ─── TIC-TAC-TOE ────────────────────────────────────────
    if (id.startsWith("ttt_")) {
      const parts = id.split("_");
      const idx = parseInt(parts[1]);
      const gameKey = parts.slice(2).join("_");
      const game = tttGames.get(gameKey);
      if (!game) return interaction.reply({ content: "❌ Game not found.", ephemeral: true });

      const currentPlayerId = game.players[game.current];
      if (interaction.user.id !== currentPlayerId) return interaction.reply({ content: "❌ It's not your turn!", ephemeral: true });
      if (game.board[idx]) return interaction.reply({ content: "❌ That cell is already taken!", ephemeral: true });

      const sym = game.symbols[game.current];
      game.board[idx] = sym;

      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const win = wins.some((w) => w.every((i) => game.board[i] === sym));
      const draw = !win && game.board.every(Boolean);

      const p1 = `<@${game.players[0]}>`;
      const p2 = `<@${game.players[1]}>`;
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import("discord.js");

      const buildComponents = (disabled = false) =>
        [0, 3, 6].map((row) =>
          new ActionRowBuilder<any>().addComponents(
            [0, 1, 2].map((col) => {
              const i = row + col;
              return new ButtonBuilder()
                .setCustomId(`ttt_${i}_${gameKey}`)
                .setLabel(game.board[i] || "·")
                .setStyle(game.board[i] === "X" ? ButtonStyle.Danger : game.board[i] === "O" ? ButtonStyle.Primary : ButtonStyle.Secondary)
                .setDisabled(!!game.board[i] || disabled);
            })
          )
        );

      if (win) {
        tttGames.delete(gameKey);
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xffd700).setTitle("❌⭕ Tic-Tac-Toe — 🏆 Winner!")
            .setDescription(`**${sym === "X" ? p1 : p2}** wins as ${sym === "X" ? "❌" : "⭕"}!`)
            .setTimestamp()],
          components: buildComponents(true),
        });
      }

      if (draw) {
        tttGames.delete(gameKey);
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xffff00).setTitle("❌⭕ Tic-Tac-Toe — 🤝 Draw!").setDescription("Nobody wins! Well played.").setTimestamp()],
          components: buildComponents(true),
        });
      }

      game.current = game.current === 0 ? 1 : 0;
      const next = game.players[game.current];

      return interaction.update({
        embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("❌⭕ Tic-Tac-Toe")
          .setDescription(`${p1} ❌ vs ${p2} ⭕\n\n<@${next}>'s turn!`)
          .setTimestamp()],
        components: buildComponents(),
      });
    }

    return;
  }
}
