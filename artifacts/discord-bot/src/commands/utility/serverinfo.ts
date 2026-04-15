import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("View information about this server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    await guild.fetch();

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "🆔 Server ID", value: guild.id, inline: true },
        { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "👥 Members", value: guild.memberCount.toString(), inline: true },
        { name: "🤖 Bots", value: guild.members.cache.filter((m) => m.user.bot).size.toString(), inline: true },
        { name: "💬 Channels", value: `📝 ${textChannels} | 🔊 ${voiceChannels} | 📁 ${categories}`, inline: true },
        { name: "🎭 Roles", value: guild.roles.cache.size.toString(), inline: true },
        { name: "😀 Emojis", value: guild.emojis.cache.size.toString(), inline: true },
        { name: "🚀 Boosts", value: `${guild.premiumSubscriptionCount || 0} (Tier ${guild.premiumTier})`, inline: true },
        { name: "Verification", value: ["None", "Low", "Medium", "High", "Very High"][guild.verificationLevel], inline: true },
      )
      .setImage(guild.bannerURL({ size: 1024 }))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
