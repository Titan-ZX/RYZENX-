import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to kick").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the kick")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as any;
    const reason = interaction.options.getString("reason") || "No reason provided";

    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: "❌ I cannot kick this user.", ephemeral: true });

    try {
      await target.kick(`${reason} | By: ${interaction.user.tag}`);
      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("👢 User Kicked")
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Failed to kick user.", ephemeral: true });
    }
  },
};
