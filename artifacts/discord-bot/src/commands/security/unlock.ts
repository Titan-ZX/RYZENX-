import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a previously locked channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to unlock (defaults to current)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;

    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
      SendMessages: null,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("🔓 Channel Unlocked")
      .setDescription(`${channel} has been unlocked.`)
      .setFooter({ text: `By: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
