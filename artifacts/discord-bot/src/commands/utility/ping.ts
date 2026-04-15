import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency"),

  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(latency < 100 ? 0x00ff00 : latency < 200 ? 0xffaa00 : 0xff0000)
      .setTitle("🏓 Pong!")
      .addFields(
        { name: "Bot Latency", value: `${latency}ms`, inline: true },
        { name: "WebSocket Latency", value: `${wsLatency}ms`, inline: true },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
