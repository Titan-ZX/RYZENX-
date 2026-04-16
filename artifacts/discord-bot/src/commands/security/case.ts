import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("🗂️ View or manage a specific moderation case")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("🔍 View a moderation case by ID")
        .addIntegerOption((opt) => opt.setName("id").setDescription("Case ID").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("reason").setDescription("✏️ Edit the reason for a case")
        .addIntegerOption((opt) => opt.setName("id").setDescription("Case ID").setRequired(true))
        .addStringOption((opt) => opt.setName("reason").setDescription("New reason").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("delete").setDescription("🗑️ Delete a moderation case")
        .addIntegerOption((opt) => opt.setName("id").setDescription("Case ID").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const caseId = interaction.options.getInteger("id", true);

    if (sub === "view") {
      const result = await pool.query(
        "SELECT * FROM warnings WHERE id = $1 AND guild_id = $2",
        [caseId, interaction.guild!.id]
      );
      if (!result.rows.length) {
        return interaction.editReply({ content: `❌ Case #${caseId} not found.` });
      }

      const c = result.rows[0];
      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle(`🗂️ Moderation Case #${caseId}`)
        .addFields(
          { name: "👤 User", value: `<@${c.user_id}> \`${c.user_id}\``, inline: true },
          { name: "👮 Moderator", value: `<@${c.moderator_id}>`, inline: true },
          { name: "📋 Reason", value: c.reason, inline: false },
          { name: "📅 Date", value: `<t:${Math.floor(new Date(c.created_at).getTime() / 1000)}:F>`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Moderation System" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === "reason") {
      const newReason = interaction.options.getString("reason", true);
      const result = await pool.query(
        "UPDATE warnings SET reason = $1 WHERE id = $2 AND guild_id = $3 RETURNING *",
        [newReason, caseId, interaction.guild!.id]
      );
      if (!result.rows.length) return interaction.editReply({ content: `❌ Case #${caseId} not found.` });
      return interaction.editReply({ content: `✅ Updated reason for case **#${caseId}**: ${newReason}` });
    }

    if (sub === "delete") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.editReply({ content: "❌ Only admins can delete cases." });
      }
      const result = await pool.query(
        "DELETE FROM warnings WHERE id = $1 AND guild_id = $2 RETURNING id",
        [caseId, interaction.guild!.id]
      );
      if (!result.rows.length) return interaction.editReply({ content: `❌ Case #${caseId} not found.` });
      return interaction.editReply({ content: `✅ Deleted moderation case **#${caseId}**.` });
    }
  },
};
