import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("View information about a user")
    .addUserOption((opt) => opt.setName("user").setDescription("User to inspect (defaults to you)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as any || interaction.member as any;
    const user = target.user || interaction.user;

    const roles = target.roles?.cache
      ?.filter((r: any) => r.id !== interaction.guild!.id)
      .map((r: any) => r.toString())
      .slice(0, 10)
      .join(", ") || "None";

    const embed = new EmbedBuilder()
      .setColor(target.displayColor || 0x5865f2)
      .setTitle(`${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 User ID", value: user.id, inline: true },
        { name: "🤖 Bot", value: user.bot ? "Yes" : "No", inline: true },
        { name: "📅 Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "📥 Joined Server", value: target.joinedTimestamp ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>` : "Unknown", inline: true },
        { name: "🎭 Nickname", value: target.nickname || "None", inline: true },
        { name: "🏆 Highest Role", value: target.roles?.highest?.toString() || "None", inline: true },
        { name: `🎭 Roles (${target.roles?.cache?.size - 1 || 0})`, value: roles || "None" },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
