import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("color")
    .setDescription("🎨 View info about a color or generate a random one")
    .addStringOption((opt) => opt.setName("hex").setDescription("Hex color code (e.g. #FF5733)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const hexInput = interaction.options.getString("hex");

    let hex = hexInput?.replace("#", "") ?? Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return interaction.reply({ content: "❌ Invalid hex code. Use format: #RRGGBB", ephemeral: true });

    const color = parseInt(hex, 16);
    const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🎨 Color #${hex.toUpperCase()}`)
      .addFields(
        { name: "🔴 Red", value: `${r}`, inline: true },
        { name: "🟢 Green", value: `${g}`, inline: true },
        { name: "🔵 Blue", value: `${b}`, inline: true },
        { name: "📊 Brightness", value: luminance > 128 ? "Light ☀️" : "Dark 🌙", inline: true },
        { name: "🔢 Decimal", value: `${color}`, inline: true },
        { name: "👁️ Preview", value: `The embed color shows this color!`, inline: true },
      )
      .setThumbnail(`https://singlecolorimage.com/get/${hex}/100x100`)
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
