import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode on a channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((opt) => opt.setName("seconds").setDescription("Slowmode delay in seconds (0 to disable)").setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to set slowmode on")),

  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger("seconds", true);
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;

    await channel.setRateLimitPerUser(seconds);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("⏱️ Slowmode Updated")
      .setDescription(seconds === 0 ? `Slowmode disabled in ${channel}` : `Slowmode set to **${seconds}s** in ${channel}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
