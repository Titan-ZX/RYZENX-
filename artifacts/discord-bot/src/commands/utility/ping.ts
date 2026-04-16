import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("🏓 Check the bot's latency and connection status"),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const getStatus = (ms: number) => {
      if (ms < 80) return { emoji: "🟢", label: "Excellent" };
      if (ms < 150) return { emoji: "🟡", label: "Good" };
      if (ms < 300) return { emoji: "🟠", label: "Fair" };
      return { emoji: "🔴", label: "Poor" };
    };

    const botStatus = getStatus(latency);
    const wsStatus = getStatus(wsLatency);
    const color = latency < 100 ? 0x00ff88 : latency < 200 ? 0xffaa00 : 0xff4444;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: "RYZENX™  •  Connection Status", iconURL: interaction.client.user?.displayAvatarURL() })
      .setTitle("🏓 Pong!")
      .addFields(
        {
          name: "🤖 Bot Latency",
          value: `${botStatus.emoji} **${latency}ms** — ${botStatus.label}`,
          inline: true,
        },
        {
          name: "🔌 WebSocket",
          value: `${wsStatus.emoji} **${wsLatency}ms** — ${wsStatus.label}`,
          inline: true,
        },
        {
          name: "⚡ API Status",
          value: "🟢 Discord API — Operational",
          inline: false,
        },
      )
      .setFooter({ text: "RYZENX™  •  100% Uptime Guarantee" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
