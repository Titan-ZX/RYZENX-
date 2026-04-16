import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { pool } from "../../database";
import { endGiveaway, fetchReactionEntries, pickWinners, buildEndedEmbed } from "../../handlers/giveaway";

export default {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("🎉 Giveaway management")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("🎉 Start a new giveaway (react 🎉 to enter)")
        .addStringOption((opt) => opt.setName("prize").setDescription("What are you giving away?").setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(43200)
        )
        .addIntegerOption((opt) =>
          opt.setName("winners").setDescription("Number of winners (default: 1)").setMinValue(1).setMaxValue(20)
        )
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to post in (default: current)"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("🛑 Manually end a giveaway and pick winners")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Giveaway ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("🔄 Re-roll winners for an ended giveaway")
        .addIntegerOption((opt) =>
          opt.setName("id").setDescription("Giveaway ID").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("winners").setDescription("How many new winners to pick (default: 1)")
          .setMinValue(1).setMaxValue(20)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("📋 List all active giveaways")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    // ── START ──────────────────────────────────────────────────────
    if (sub === "start") {
      await interaction.deferReply({ ephemeral: true });

      const prize   = interaction.options.getString("prize", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const winners = interaction.options.getInteger("winners") || 1;
      const channel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
      const endsAt  = new Date(Date.now() + minutes * 60 * 1000);
      const endsTs  = Math.floor(endsAt.getTime() / 1000);

      const gwResult = await pool.query(
        `INSERT INTO giveaways (guild_id, channel_id, host_id, prize, winners, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [interaction.guild!.id, channel.id, interaction.user.id, prize, winners, endsAt]
      );
      const gwId = gwResult.rows[0].id;

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🎉  G I V E A W A Y  🎉")
        .setDescription(
          `## 🎁 ${prize}\n\n` +
          `React with 🎉 below to enter!\n`
        )
        .addFields(
          { name: "🏆 Winners",   value: `**${winners}**`,                         inline: true },
          { name: "⏰ Ends",      value: `<t:${endsTs}:R>`,                        inline: true },
          { name: "📅 End Time",  value: `<t:${endsTs}:F>`,                        inline: true },
          { name: "🎪 Hosted by", value: `<@${interaction.user.id}>`,              inline: true },
          { name: "🆔 ID",        value: `#${gwId}`,                               inline: true },
          { name: "👥 Entries",   value: `React 🎉 to see your name here!`,        inline: true },
        )
        .setFooter({ text: "RYZENX™ Giveaway System  •  React 🎉 to enter!" })
        .setTimestamp(endsAt);

      const msg = await channel.send({ embeds: [embed] });

      // Add the 🎉 reaction so users can click it
      await msg.react("🎉").catch(() => {});

      await pool.query("UPDATE giveaways SET message_id = $1 WHERE id = $2", [msg.id, gwId]);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff88)
            .setTitle("✅ Giveaway Started!")
            .setDescription(
              `**Prize:** ${prize}\n` +
              `**Channel:** ${channel}\n` +
              `**Ends:** <t:${endsTs}:R>\n` +
              `**ID:** #${gwId}`
            )
            .setFooter({ text: "RYZENX™ Giveaway System" })
        ],
      });
    }

    // ── END ────────────────────────────────────────────────────────
    if (sub === "end") {
      await interaction.deferReply({ ephemeral: true });

      const gwId = interaction.options.getInteger("id", true);
      const check = await pool.query(
        "SELECT * FROM giveaways WHERE id = $1 AND guild_id = $2 AND ended = false",
        [gwId, interaction.guild!.id]
      );

      if (!check.rows.length) {
        return interaction.editReply({ content: "❌ No active giveaway found with that ID." });
      }

      const result = await endGiveaway(interaction.client, gwId, interaction.user.tag);
      if (!result) return interaction.editReply({ content: "❌ Could not end giveaway." });

      const { winners, entries } = result;
      const winnerText = winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No participants";

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle("🎉 Giveaway Ended!")
            .setDescription(`**Winner(s):** ${winnerText}\n**Participants:** ${entries.length}`)
            .setFooter({ text: "RYZENX™ Giveaway System" })
            .setTimestamp()
        ],
      });
    }

    // ── REROLL ────────────────────────────────────────────────────
    if (sub === "reroll") {
      await interaction.deferReply({ ephemeral: false });

      const gwId = interaction.options.getInteger("id", true);
      const count = interaction.options.getInteger("winners") || 1;

      const check = await pool.query(
        "SELECT * FROM giveaways WHERE id = $1 AND guild_id = $2",
        [gwId, interaction.guild!.id]
      );
      if (!check.rows.length) {
        return interaction.editReply({ content: "❌ Giveaway not found." });
      }

      const giveaway = check.rows[0];
      const entries = await fetchReactionEntries(interaction.client, giveaway);
      if (!entries.length) {
        return interaction.editReply({ content: "❌ No valid entries found for this giveaway." });
      }

      const newWinners = pickWinners(entries, count);
      const winnerText = newWinners.map((id) => `<@${id}>`).join(", ");

      const embed = new EmbedBuilder()
        .setColor(0xff9ff3)
        .setTitle("🔄 Giveaway Re-rolled!")
        .setDescription(
          `🎁 **Prize:** ${giveaway.prize}\n\n` +
          `🟡 **New Winner${newWinners.length > 1 ? "s" : ""}:** ${winnerText}\n` +
          `🟡 **Total Participants:** ${entries.length}`
        )
        .setFooter({ text: `Re-rolled by ${interaction.user.tag} • RYZENX™` })
        .setTimestamp();

      return interaction.editReply({
        content: `🎊 New winner(s): ${winnerText}`,
        embeds: [embed],
      });
    }

    // ── LIST ──────────────────────────────────────────────────────
    if (sub === "list") {
      const result = await pool.query(
        "SELECT * FROM giveaways WHERE guild_id = $1 AND ended = false ORDER BY ends_at ASC",
        [interaction.guild!.id]
      );

      if (!result.rows.length) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0x888888).setDescription("📭 No active giveaways running right now.")],
          ephemeral: true,
        });
      }

      const lines = result.rows.map((g: any) => {
        const ts = Math.floor(new Date(g.ends_at).getTime() / 1000);
        return `🎁 **#${g.id}** — **${g.prize}**\n   ⏰ Ends <t:${ts}:R> • 🏆 ${g.winners} winner(s) • 🎪 <@${g.host_id}>`;
      });

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle("🎉 Active Giveaways")
            .setDescription(lines.join("\n\n"))
            .setFooter({ text: `RYZENX™ Giveaway System  •  ${result.rows.length} active` })
            .setTimestamp()
        ],
      });
    }
  },
};
