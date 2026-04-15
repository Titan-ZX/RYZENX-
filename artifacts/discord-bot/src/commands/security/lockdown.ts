import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel, PermissionsBitField } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("Lock a channel so only mods can send messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to lock (defaults to current)"))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for lockdown")),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
    const reason = interaction.options.getString("reason") || "No reason provided";

    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🔒 Channel Locked")
      .setDescription(`${channel} has been locked down.\n**Reason:** ${reason}`)
      .setFooter({ text: `By: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
