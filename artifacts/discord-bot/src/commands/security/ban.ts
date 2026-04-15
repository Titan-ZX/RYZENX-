import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) => opt.setName("user").setDescription("User to ban").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for the ban"))
    .addIntegerOption((opt) => opt.setName("days").setDescription("Days of messages to delete (0-7)").setMinValue(0).setMaxValue(7)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided";
    const days = interaction.options.getInteger("days") || 0;

    const member = interaction.guild?.members.cache.get(target.id);
    if (member && !member.bannable) {
      return interaction.reply({ content: "❌ I cannot ban this user.", ephemeral: true });
    }

    try {
      await interaction.guild?.bans.create(target.id, { reason: `${reason} | By: ${interaction.user.tag}`, deleteMessageDays: days });
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔨 User Banned")
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "User", value: `${target.tag} (${target.id})`, inline: true },
          { name: "Moderator", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: "❌ Failed to ban user.", ephemeral: true });
    }
  },
};
