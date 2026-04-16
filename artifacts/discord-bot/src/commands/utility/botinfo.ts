import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("⚡ RYZENX™ system stats, uptime & features"),

  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    const uptimeStr = `${d > 0 ? d + "d " : ""}${h}h ${m}m ${s}s`;

    const mem = process.memoryUsage();
    const memMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
    const memPct = Math.floor((mem.heapUsed / mem.heapTotal) * 100);
    const memBar = "█".repeat(Math.floor(memPct / 10)) + "░".repeat(10 - Math.floor(memPct / 10));

    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: "RYZENX™  •  Ultra-Advanced Discord Bot", iconURL: client.user?.displayAvatarURL() })
      .setTitle(`⚡ ${client.user?.username} — System Dashboard`)
      .setThumbnail(client.user?.displayAvatarURL({ size: 256 }) ?? null)
      .addFields(
        {
          name: "📊 Bot Stats",
          value: [
            `🤖 **Tag:** ${client.user?.tag}`,
            `🆔 **ID:** \`${client.user?.id}\``,
            `🏠 **Servers:** ${client.guilds.cache.size}`,
            `👥 **Total Users:** ${totalUsers.toLocaleString()}`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "⚙️ Performance",
          value: [
            `⏱️ **Uptime:** ${uptimeStr}`,
            `📡 **Ping:** ${client.ws.ping}ms`,
            `💾 **Memory:** ${memMB}/${totalMB} MB`,
            `\`[${memBar}]\` ${memPct}%`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🛠️ Technical",
          value: [
            `⚙️ **Node.js:** ${process.version}`,
            `📦 **Discord.js:** v14`,
            `🗄️ **Database:** PostgreSQL`,
            `🚀 **Platform:** Replit`,
          ].join("\n"),
          inline: true,
        },
        {
          name: "🌟 Features",
          value: "🛡️ AutoMod  ⚔️ Security  🎮 Games  💰 Economy  🎙️ Voice Master  🎫 Tickets  🌟 Community  🔧 Utility  💕 Social",
          inline: false,
        },
      )
      .setFooter({ text: `RYZENX™  •  150+ Commands  •  Always Improving` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
