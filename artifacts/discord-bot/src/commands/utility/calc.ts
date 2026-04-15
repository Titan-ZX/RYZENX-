import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

function safeEval(expr: string): number {
  const clean = expr.replace(/[^0-9+\-*/.()%^ ]/g, "").replace(/\^/g, "**");
  if (!clean.trim()) throw new Error("Empty expression");
  return Function(`"use strict"; return (${clean})`)();
}

export default {
  data: new SlashCommandBuilder()
    .setName("calc")
    .setDescription("🧮 Advanced calculator — evaluate math expressions")
    .addStringOption((opt) => opt.setName("expression").setDescription("Math expression (e.g. 2+2*3, 100/4, 2^10)").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const expr = interaction.options.getString("expression", true);

    try {
      const result = safeEval(expr);
      if (!isFinite(result)) throw new Error("Result is infinite");

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("🧮 Calculator")
        .addFields(
          { name: "📝 Expression", value: `\`${expr}\``, inline: true },
          { name: "✅ Result", value: `\`${result}\``, inline: true },
        )
        .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: `❌ Invalid expression: \`${expr}\`\n\nUse operators: + - * / ^ % and parentheses.`, ephemeral: true });
    }
  },
};
