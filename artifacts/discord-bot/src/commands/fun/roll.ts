import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a dice")
    .addStringOption((opt) => opt.setName("dice").setDescription("Dice notation (e.g. 2d6, d20, 3d8) — default: 1d6")),

  async execute(interaction: ChatInputCommandInteraction) {
    const input = interaction.options.getString("dice") || "1d6";
    const match = input.match(/^(\d*)d(\d+)$/i);
    if (!match) return interaction.reply({ content: "❌ Invalid dice format. Use e.g. `2d6`, `d20`.", ephemeral: true });

    const count = parseInt(match[1] || "1");
    const sides = parseInt(match[2]);

    if (count > 100 || sides > 10000) return interaction.reply({ content: "❌ Too many dice or sides!", ephemeral: true });

    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
    const total = rolls.reduce((a, b) => a + b, 0);

    const embed = new EmbedBuilder()
      .setColor(0x6600ff)
      .setTitle(`🎲 Dice Roll — ${input}`)
      .addFields(
        { name: "Rolls", value: rolls.join(", "), inline: true },
        { name: "Total", value: total.toString(), inline: true },
      )
      .setFooter({ text: `Rolled by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
