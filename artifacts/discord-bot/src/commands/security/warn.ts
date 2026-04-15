import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the warning").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    await pool.query(
      "INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4)",
      [target.id, interaction.guild!.id, interaction.user.id, reason]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM warnings WHERE user_id = $1 AND guild_id = $2",
      [target.id, interaction.guild!.id]
    );
    const totalWarnings = parseInt(countResult.rows[0].count);

    try {
      const dm = await target.createDM();
      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffaa00)
            .setTitle(`⚠️ You received a warning in ${interaction.guild!.name}`)
            .addFields({ name: "Reason", value: reason })
            .setTimestamp(),
        ],
      });
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle("⚠️ User Warned")
      .addFields(
        { name: "User", value: `${target.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: interaction.user.tag, inline: true },
        { name: "Reason", value: reason },
        { name: "Total Warnings", value: totalWarnings.toString(), inline: true },
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
