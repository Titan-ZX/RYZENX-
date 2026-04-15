import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel, VoiceChannel, ChannelType } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("📋 Get information about a channel")
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to inspect (default: current)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as any;
    if (!channel) return interaction.reply({ content: "❌ Channel not found.", ephemeral: true });

    const typeNames: Record<number, string> = {
      [ChannelType.GuildText]: "📝 Text", [ChannelType.GuildVoice]: "🔊 Voice",
      [ChannelType.GuildCategory]: "📁 Category", [ChannelType.GuildAnnouncement]: "📢 Announcement",
      [ChannelType.GuildForum]: "💬 Forum", [ChannelType.GuildStageVoice]: "🎙️ Stage",
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 #${channel.name}`)
      .addFields(
        { name: "🆔 ID", value: channel.id, inline: true },
        { name: "📌 Type", value: typeNames[channel.type] || "Unknown", inline: true },
        { name: "🗂️ Category", value: channel.parent?.name || "None", inline: true },
        { name: "📝 Topic", value: (channel as TextChannel).topic || "No topic", inline: false },
        { name: "📅 Created", value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "🔒 NSFW", value: (channel as TextChannel).nsfw ? "Yes" : "No", inline: true },
        { name: "⏱️ Slowmode", value: (channel as TextChannel).rateLimitPerUser ? `${(channel as TextChannel).rateLimitPerUser}s` : "None", inline: true },
      )
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
