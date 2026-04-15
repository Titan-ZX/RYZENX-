import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("🎉 Giveaway management")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("🎉 Start a giveaway")
        .addStringOption((opt) => opt.setName("prize").setDescription("Prize description").setRequired(true))
        .addIntegerOption((opt) => opt.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1))
        .addIntegerOption((opt) => opt.setName("winners").setDescription("Number of winners").setMinValue(1).setMaxValue(20))
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel for giveaway"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End a giveaway and pick winners")
        .addIntegerOption((opt) => opt.setName("id").setDescription("Giveaway ID (shown when started)").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List active giveaways")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const prize = interaction.options.getString("prize", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const winners = interaction.options.getInteger("winners") || 1;
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
      const endsAt = new Date(Date.now() + minutes * 60 * 1000);

      const gwResult = await pool.query(
        "INSERT INTO giveaways (guild_id, channel_id, host_id, prize, winners, ends_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [interaction.guild!.id, channel.id, interaction.user.id, prize, winners, endsAt]
      );
      const gwId = gwResult.rows[0].id;

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🎉 GIVEAWAY!")
        .setDescription(`## 🎁 ${prize}\n\n**Click the button below to enter!**`)
        .addFields(
          { name: "🏆 Winners", value: `${winners}`, inline: true },
          { name: "⏰ Ends", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:R>`, inline: true },
          { name: "📅 End Time", value: `<t:${Math.floor(endsAt.getTime() / 1000)}:F>`, inline: true },
          { name: "🎪 Hosted By", value: `<@${interaction.user.id}>`, inline: true },
          { name: "🆔 Giveaway ID", value: `#${gwId}`, inline: true },
          { name: "👥 Entries", value: `0`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Giveaway System • React with button below" })
        .setTimestamp(endsAt);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_enter_${gwId}`)
          .setLabel("🎉 Enter Giveaway")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`giveaway_info_${gwId}`)
          .setLabel("📊 Info")
          .setStyle(ButtonStyle.Secondary)
      );

      const msg = await channel.send({ embeds: [embed], components: [row] });
      await pool.query("UPDATE giveaways SET message_id = $1 WHERE id = $2", [msg.id, gwId]);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00)
            .setDescription(`✅ Giveaway **#${gwId}** started in ${channel}!\nPrize: **${prize}** | Ends: <t:${Math.floor(endsAt.getTime() / 1000)}:R>`)
        ],
        ephemeral: true,
      });
    }

    if (sub === "end") {
      const gwId = interaction.options.getInteger("id", true);
      const result = await pool.query(
        "SELECT * FROM giveaways WHERE id = $1 AND guild_id = $2 AND ended = false",
        [gwId, interaction.guild!.id]
      );

      if (!result.rows.length) {
        return interaction.reply({ content: "❌ Active giveaway not found with that ID.", ephemeral: true });
      }

      const giveaway = result.rows[0];
      const entries = await pool.query(
        "SELECT user_id FROM giveaway_entries WHERE giveaway_id = $1",
        [gwId]
      );

      const entryPool = entries.rows.map((r: any) => r.user_id);
      const selectedWinners: string[] = [];
      const pool2 = [...entryPool];

      for (let i = 0; i < Math.min(giveaway.winners, pool2.length); i++) {
        const idx = Math.floor(Math.random() * pool2.length);
        selectedWinners.push(`<@${pool2[idx]}>`);
        pool2.splice(idx, 1);
      }

      const winnerText = selectedWinners.length > 0 ? selectedWinners.join(", ") : "No participants";
      const channel = interaction.guild!.channels.cache.get(giveaway.channel_id) as TextChannel;

      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("🎉 Giveaway Ended!")
          .setDescription(`## 🎁 ${giveaway.prize}\n\n🏆 **Winner(s):** ${winnerText}`)
          .addFields(
            { name: "📊 Total Entries", value: `${entryPool.length}`, inline: true },
            { name: "🎪 Hosted By", value: `<@${giveaway.host_id}>`, inline: true },
          )
          .setFooter({ text: "RYZENX™ Giveaway System" })
          .setTimestamp();

        await channel.send({ content: selectedWinners.length ? `🎉 Congratulations ${winnerText}!` : "", embeds: [embed] });

        if (giveaway.message_id) {
          try {
            const oldMsg = await channel.messages.fetch(giveaway.message_id);
            await oldMsg.edit({ components: [] });
          } catch {}
        }
      }

      await pool.query("UPDATE giveaways SET ended = true WHERE id = $1", [gwId]);
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription(`✅ Giveaway **#${gwId}** ended! Winners: ${winnerText}`)],
        ephemeral: true,
      });
    }

    if (sub === "list") {
      const result = await pool.query(
        "SELECT g.*, (SELECT COUNT(*) FROM giveaway_entries ge WHERE ge.giveaway_id = g.id) as entry_count FROM giveaways g WHERE g.guild_id = $1 AND g.ended = false ORDER BY g.ends_at ASC",
        [interaction.guild!.id]
      );

      if (!result.rows.length) {
        return interaction.reply({ content: "No active giveaways in this server.", ephemeral: true });
      }

      const lines = result.rows.map((g: any) =>
        `**#${g.id}** — ${g.prize} | Ends: <t:${Math.floor(new Date(g.ends_at).getTime() / 1000)}:R> | ${g.entry_count} entries`
      );

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🎉 Active Giveaways")
        .setDescription(lines.join("\n"))
        .setFooter({ text: "RYZENX™ Giveaway System" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
