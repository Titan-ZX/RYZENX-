import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("View warnings for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to check").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const result = await pool.query(
      "SELECT * FROM warnings WHERE user_id = $1 AND guild_id = $2 ORDER BY created_at DESC LIMIT 10",
      [target.id, interaction.guild!.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0xffaa00)
      .setTitle(`⚠️ Warnings for ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: `Total: ${result.rows.length} warning(s)` })
      .setTimestamp();

    if (result.rows.length === 0) {
      embed.setDescription("No warnings found.");
    } else {
      for (const w of result.rows) {
        embed.addFields({
          name: `#${w.id} — ${new Date(w.created_at).toLocaleDateString()}`,
          value: `**Reason:** ${w.reason}\n**By:** <@${w.moderator_id}>`,
        });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
