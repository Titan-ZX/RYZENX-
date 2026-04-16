import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("👤 View detailed information about a user")
    .addUserOption((opt) => opt.setName("user").setDescription("User to inspect (defaults to you)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = (interaction.options.getMember("user") as any) || (interaction.member as any);
    const user = target?.user || interaction.user;
    await user.fetch().catch(() => {});

    const joinedAt = target?.joinedTimestamp;
    const createdAt = user.createdTimestamp;

    const roles = target?.roles?.cache
      ?.filter((r: any) => r.id !== interaction.guild!.id)
      .sort((a: any, b: any) => b.position - a.position)
      .map((r: any) => r.toString())
      .slice(0, 8)
      .join(" ") || "*No roles*";

    const roleCount = (target?.roles?.cache?.size || 1) - 1;

    const badges: string[] = [];
    const flags = user.flags?.toArray() || [];
    if (flags.includes("Staff")) badges.push("👨‍💼 Discord Staff");
    if (flags.includes("Partner")) badges.push("🤝 Partner");
    if (flags.includes("Hypesquad")) badges.push("🏅 HypeSquad");
    if (flags.includes("BugHunterLevel1")) badges.push("🐛 Bug Hunter");
    if (flags.includes("BugHunterLevel2")) badges.push("🏆 Bug Hunter Gold");
    if (flags.includes("HypeSquadOnlineHouse1")) badges.push("🏠 Bravery");
    if (flags.includes("HypeSquadOnlineHouse2")) badges.push("🏠 Brilliance");
    if (flags.includes("HypeSquadOnlineHouse3")) badges.push("🏠 Balance");
    if (flags.includes("PremiumEarlySupporter")) badges.push("💜 Early Supporter");
    if (flags.includes("ActiveDeveloper")) badges.push("🧑‍💻 Active Dev");
    if (user.bot) badges.push("🤖 Bot");

    const accountAge = Math.floor((Date.now() - createdAt) / 86400000);
    const joinedAge = joinedAt ? Math.floor((Date.now() - joinedAt) / 86400000) : null;

    const color = target?.displayColor && target.displayColor !== 0 ? target.displayColor : 0x5865f2;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 128 }) })
      .setTitle(`👤 ${target?.nickname || user.username}`)
      .setDescription(badges.length ? badges.join("  ") : "*No special badges*")
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: "📋 User Info",
          value: [
            `**Tag:** ${user.tag}`,
            `**ID:** \`${user.id}\``,
            `**Created:** <t:${Math.floor(createdAt / 1000)}:D> *(${accountAge}d ago)*`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "📥 Server Info",
          value: [
            `**Joined:** ${joinedAt ? `<t:${Math.floor(joinedAt / 1000)}:D>` : "Unknown"}${joinedAge !== null ? ` *(${joinedAge}d ago)*` : ""}`,
            `**Nickname:** ${target?.nickname || "*None*"}`,
            `**Highest Role:** ${target?.roles?.highest || "*None*"}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: `🎭 Roles [${roleCount}]`,
          value: roles.substring(0, 600),
          inline: false,
        },
      )
      .setFooter({ text: `RYZENX™  •  Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
