import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove a timeout from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to unmute").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as any;
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });

    try {
      await target.timeout(null, `${reason} | By: ${interaction.user.tag}`);
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Timeout Removed")
        .addFields(
          { name: "User", value: `${target.user.tag}`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Failed to remove timeout.", ephemeral: true });
    }
  },
};
