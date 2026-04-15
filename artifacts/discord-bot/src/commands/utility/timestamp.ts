import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("timestamp")
    .setDescription("🕐 Convert a date to Discord timestamp formats")
    .addStringOption((opt) => opt.setName("date").setDescription("Date (e.g: 2024-12-25 or leave empty for now)"))
    .addStringOption((opt) => opt.setName("time").setDescription("Time in HH:MM format (24h)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const dateStr = interaction.options.getString("date");
    const timeStr = interaction.options.getString("time");

    let date: Date;
    if (dateStr) {
      date = new Date(dateStr + (timeStr ? ` ${timeStr}` : " 00:00"));
      if (isNaN(date.getTime())) return interaction.reply({ content: "❌ Invalid date format. Use: YYYY-MM-DD", ephemeral: true });
    } else {
      date = new Date();
    }

    const unix = Math.floor(date.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🕐 Discord Timestamps")
      .setDescription(`Unix timestamp: \`${unix}\``)
      .addFields(
        { name: "Short Time", value: `<t:${unix}:t> → \`<t:${unix}:t>\``, inline: true },
        { name: "Long Time", value: `<t:${unix}:T> → \`<t:${unix}:T>\``, inline: true },
        { name: "Short Date", value: `<t:${unix}:d> → \`<t:${unix}:d>\``, inline: true },
        { name: "Long Date", value: `<t:${unix}:D> → \`<t:${unix}:D>\``, inline: true },
        { name: "Full", value: `<t:${unix}:f> → \`<t:${unix}:f>\``, inline: true },
        { name: "Relative", value: `<t:${unix}:R> → \`<t:${unix}:R>\``, inline: true },
      )
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
