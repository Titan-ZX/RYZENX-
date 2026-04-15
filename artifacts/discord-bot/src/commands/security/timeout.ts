import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to timeout").setRequired(true))
    .addIntegerOption((opt) => opt.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as any;
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: "❌ I cannot timeout this user.", ephemeral: true });

    try {
      await target.timeout(minutes * 60 * 1000, `${reason} | By: ${interaction.user.tag}`);
      const embed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle("⏱️ User Timed Out")
        .addFields(
          { name: "User", value: `${target.user.tag}`, inline: true },
          { name: "Duration", value: `${minutes} minute(s)`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Failed to timeout user.", ephemeral: true });
    }
  },
};
