import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("📨 Create and send a custom embed message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("title").setDescription("Embed title").setRequired(true).setMaxLength(256))
    .addStringOption((opt) => opt.setName("description").setDescription("Embed description").setRequired(true).setMaxLength(2048))
    .addStringOption((opt) => opt.setName("color").setDescription("Hex color (e.g. #FF0000)"))
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to send to (default: current)"))
    .addStringOption((opt) => opt.setName("footer").setDescription("Footer text"))
    .addStringOption((opt) => opt.setName("image").setDescription("Image URL")),

  async execute(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString("title", true);
    const description = interaction.options.getString("description", true);
    const colorStr = interaction.options.getString("color");
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
    const footer = interaction.options.getString("footer");
    const image = interaction.options.getString("image");

    let color = 0x5865f2;
    if (colorStr) {
      const parsed = parseInt(colorStr.replace("#", ""), 16);
      if (!isNaN(parsed)) color = parsed;
    }

    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setTimestamp();
    if (footer) embed.setFooter({ text: footer });
    if (image) embed.setImage(image);

    try {
      await channel.send({ embeds: [embed] });
      await interaction.reply({ content: `✅ Embed sent to ${channel}!`, ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ Failed to send embed. Check permissions.", ephemeral: true });
    }
  },
};
