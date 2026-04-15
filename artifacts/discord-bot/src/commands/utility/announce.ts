import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("📢 Send a server announcement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) => opt.setName("message").setDescription("Announcement message").setRequired(true).setMaxLength(2000))
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to announce in").setRequired(true))
    .addRoleOption((opt) => opt.setName("ping").setDescription("Role to ping (optional)"))
    .addStringOption((opt) => opt.setName("title").setDescription("Announcement title")),

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);
    const channel = interaction.options.getChannel("channel", true) as TextChannel;
    const pingRole = interaction.options.getRole("ping");
    const title = interaction.options.getString("title") || "📢 Announcement";

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(title)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.tag} • RYZENX™` })
      .setTimestamp();

    try {
      await channel.send({ content: pingRole ? `<@&${pingRole.id}>` : undefined, embeds: [embed] });
      await interaction.reply({ content: `✅ Announcement sent to ${channel}!`, ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ Failed to send announcement.", ephemeral: true });
    }
  },
};
