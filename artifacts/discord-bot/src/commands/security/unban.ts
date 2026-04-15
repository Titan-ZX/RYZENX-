import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("🔓 Unban a user from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((opt) => opt.setName("user_id").setDescription("User ID to unban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for unban")),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString("user_id", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    try {
      const ban = await interaction.guild!.bans.fetch(userId);
      await interaction.guild!.members.unban(userId, reason);

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("🔓 User Unbanned")
        .addFields(
          { name: "👤 User", value: `${ban.user.tag} (${userId})`, inline: true },
          { name: "👮 Moderator", value: interaction.user.tag, inline: true },
          { name: "📋 Reason", value: reason, inline: false },
        )
        .setThumbnail(ban.user.displayAvatarURL())
        .setFooter({ text: "RYZENX™ Security" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: `❌ Could not unban. Make sure the user ID (\`${userId}\`) is correct and they are banned.`, ephemeral: true });
    }
  },
};
