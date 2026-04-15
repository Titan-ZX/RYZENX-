import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("softban")
    .setDescription("Ban then immediately unban a user to delete their messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to softban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";

    try {
      await interaction.guild?.bans.create(target.id, { reason: `Softban: ${reason}`, deleteMessageDays: 7 });
      await interaction.guild?.bans.remove(target.id, "Softban unban");
      const embed = new EmbedBuilder()
        .setColor(0xff8800)
        .setTitle("🔨 User Softbanned")
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})` },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Failed to softban user.", ephemeral: true });
    }
  },
};
