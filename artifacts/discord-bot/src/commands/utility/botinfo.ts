import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Get information about the bot"),

  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const memUsage = process.memoryUsage();
    const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${client.user?.username} — Bot Info`)
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .addFields(
        { name: "🤖 Bot Tag", value: client.user?.tag || "Unknown", inline: true },
        { name: "🆔 Bot ID", value: client.user?.id || "Unknown", inline: true },
        { name: "🏠 Servers", value: client.guilds.cache.size.toString(), inline: true },
        { name: "👥 Users", value: client.users.cache.size.toString(), inline: true },
        { name: "⏱️ Uptime", value: uptimeStr, inline: true },
        { name: "📡 Ping", value: `${client.ws.ping}ms`, inline: true },
        { name: "💾 Memory", value: `${memMB} MB`, inline: true },
        { name: "⚙️ Node.js", value: process.version, inline: true },
        { name: "📦 Discord.js", value: "v14", inline: true },
        { name: "🛡️ Features", value: "Automod • Security • Fun • Utility • Community", inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
