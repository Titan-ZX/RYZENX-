import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("📋 Moderation history tools")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub.setName("user").setDescription("👤 View full moderation history for a user")
        .addUserOption((opt) => opt.setName("user").setDescription("Target user").setRequired(true))
        .addIntegerOption((opt) => opt.setName("page").setDescription("Page number").setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub.setName("bans").setDescription("🔨 View all banned users in this server")
        .addIntegerOption((opt) => opt.setName("page").setDescription("Page number").setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub.setName("clear").setDescription("🗑️ Clear all warnings for a user (Admin only)")
        .addUserOption((opt) => opt.setName("user").setDescription("Target user").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === "user") {
      const target = interaction.options.getUser("user", true);
      const page = (interaction.options.getInteger("page") ?? 1) - 1;
      const perPage = 8;

      const total = await pool.query(
        "SELECT COUNT(*) FROM warnings WHERE user_id = $1 AND guild_id = $2",
        [target.id, interaction.guild!.id]
      );
      const totalCount = parseInt(total.rows[0].count);

      const result = await pool.query(
        "SELECT * FROM warnings WHERE user_id = $1 AND guild_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
        [target.id, interaction.guild!.id, perPage, page * perPage]
      );

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setAuthor({ name: `${target.tag} — Moderation History`, iconURL: target.displayAvatarURL() })
        .setThumbnail(target.displayAvatarURL({ size: 256 }));

      if (!result.rows.length) {
        embed.setDescription("✅ This user has a clean record — no moderation history found.").setColor(0x00ff88);
      } else {
        const lines = result.rows.map((w: any) => {
          const ts = Math.floor(new Date(w.created_at).getTime() / 1000);
          return `**#${w.id}** ⚠️ <t:${ts}:R>\n📝 ${w.reason}\n👮 <@${w.moderator_id}>`;
        });
        embed.setDescription(lines.join("\n\n"))
          .addFields({ name: "📊 Summary", value: `**${totalCount}** total action${totalCount !== 1 ? "s" : ""} • Page ${page + 1}/${Math.max(1, Math.ceil(totalCount / perPage))}`, inline: false });
      }

      embed.setFooter({ text: `RYZENX™ • User ID: ${target.id}` }).setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "bans") {
      const page = (interaction.options.getInteger("page") ?? 1) - 1;
      const perPage = 10;

      try {
        const bans = await interaction.guild!.bans.fetch();
        if (!bans.size) {
          return interaction.editReply({ content: "✅ This server has no banned users." });
        }

        const banArray = [...bans.values()];
        const totalPages = Math.ceil(banArray.length / perPage);
        const pageSlice = banArray.slice(page * perPage, (page + 1) * perPage);

        const lines = pageSlice.map((ban, i) => {
          const reason = ban.reason ? ban.reason.substring(0, 60) : "No reason provided";
          return `**${page * perPage + i + 1}.** ${ban.user.tag} \`${ban.user.id}\`\n   📋 ${reason}`;
        });

        const embed = new EmbedBuilder()
          .setColor(0xff4444)
          .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() ?? undefined })
          .setTitle(`🔨 Banned Users — ${bans.size} total`)
          .setDescription(lines.join("\n\n"))
          .setFooter({ text: `RYZENX™ Security • Page ${page + 1}/${totalPages}` })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch {
        return interaction.editReply({ content: "❌ Could not fetch ban list. Check bot permissions." });
      }
    }

    if (sub === "clear") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: "❌ Only **Administrators** can clear warnings." });
      }
      const target = interaction.options.getUser("user", true);
      const result = await pool.query(
        "DELETE FROM warnings WHERE user_id = $1 AND guild_id = $2",
        [target.id, interaction.guild!.id]
      );
      return interaction.editReply({ content: `✅ Cleared **${result.rowCount ?? 0}** warning(s) for **${target.tag}**.` });
    }
  },
};
