import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("math")
    .setDescription("Evaluate a math expression")
    .addStringOption((opt) => opt.setName("expression").setDescription("Math expression (e.g. 2+2, sqrt(16), 5*3)").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const expr = interaction.options.getString("expression", true);
    const sanitized = expr.replace(/[^0-9+\-*/().,%^ ]/g, "").trim();

    if (!sanitized) return interaction.reply({ content: "❌ Invalid expression.", ephemeral: true });

    try {
      const result = Function(`"use strict"; return (${sanitized.replace(/\^/g, "**")})`)();
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("🧮 Math Result")
        .addFields(
          { name: "Expression", value: `\`${expr}\``, inline: true },
          { name: "Result", value: `\`${result}\``, inline: true },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Invalid math expression.", ephemeral: true });
    }
  },
};
