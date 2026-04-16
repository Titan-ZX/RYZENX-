import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from "discord.js";

const VERIFICATION = ["🔓 None", "🟢 Low", "🟡 Medium", "🟠 High", "🔴 Very High"];
const BOOST_COLORS = [0x99aab5, 0xff73fa, 0xff73fa, 0xe91e63];

export default {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("🏰 View detailed statistics about this server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    await guild.fetch();

    const members = await guild.members.fetch();
    const humans = members.filter((m) => !m.user.bot).size;
    const bots = members.filter((m) => m.user.bot).size;
    const online = members.filter((m) => m.presence?.status !== "offline" && m.presence?.status !== undefined).size;

    const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildVoice).size;
    const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory).size;
    const forums = guild.channels.cache.filter((c) => c.type === ChannelType.GuildForum).size;
    const stages = guild.channels.cache.filter((c) => c.type === ChannelType.GuildStageVoice).size;

    const boostTier = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const boostColor = BOOST_COLORS[Math.min(boostTier, 3)];
    const boostBar = boostTier >= 1 ? `${"💎".repeat(Math.min(boostCount, 5))}` : "No boosts";

    const features = guild.features
      .filter((f) => ["COMMUNITY", "PARTNERED", "VERIFIED", "DISCOVERABLE", "ANIMATED_ICON"].includes(f as string))
      .map((f) => ({
        COMMUNITY: "🏘️ Community",
        PARTNERED: "🤝 Partnered",
        VERIFIED: "✅ Verified",
        DISCOVERABLE: "🔍 Discoverable",
        ANIMATED_ICON: "✨ Animated Icon",
      }[f as string] ?? f))
      .join(", ") || "None";

    const createdDays = Math.floor((Date.now() - guild.createdTimestamp) / 86400000);

    const embed = new EmbedBuilder()
      .setColor(boostColor || 0x5865f2)
      .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 128 }) ?? undefined })
      .setTitle(`🏰 ${guild.name}`)
      .setDescription(`**ID:** \`${guild.id}\`\n**Owner:** <@${guild.ownerId}>\n**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D> *(${createdDays} days ago)*`)
      .addFields(
        {
          name: "👥 Members",
          value: `👤 **${humans.toLocaleString()}** humans\n🤖 **${bots}** bots\n🌐 **${guild.memberCount.toLocaleString()}** total`,
          inline: true,
        },
        {
          name: "💬 Channels",
          value: `📝 **${textChannels}** text\n🔊 **${voiceChannels}** voice\n📁 **${categories}** categories${forums > 0 ? `\n💬 **${forums}** forums` : ""}${stages > 0 ? `\n🎙️ **${stages}** stages` : ""}`,
          inline: true,
        },
        {
          name: "🚀 Boost Status",
          value: `${boostBar}\n🏆 **Tier ${boostTier}** — ${boostCount} boost${boostCount !== 1 ? "s" : ""}`,
          inline: true,
        },
        {
          name: "🎭 Roles",
          value: `**${guild.roles.cache.size}** roles`,
          inline: true,
        },
        {
          name: "😀 Emojis",
          value: `**${guild.emojis.cache.size}** emojis\n✨ **${guild.stickers.cache.size}** stickers`,
          inline: true,
        },
        {
          name: "🔒 Security",
          value: `${VERIFICATION[guild.verificationLevel]}\n🛡️ Explicit Filter: **${["Disabled","Members without roles","All members"][guild.explicitContentFilter]}**`,
          inline: true,
        },
        {
          name: "⭐ Features",
          value: features,
          inline: false,
        },
      )
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setImage(guild.bannerURL({ size: 1024 }) ?? null)
      .setFooter({ text: `RYZENX™ Server Info  •  ${guild.memberCount.toLocaleString()} members` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
