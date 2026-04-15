import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin"),

  async execute(interaction: ChatInputCommandInteraction) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🪙 Coin Flip — ${result}`)
      .setDescription(result === "Heads" ? "🟡 **HEADS**" : "⚪ **TAILS**")
      .setFooter({ text: `Flipped by ${interaction.user.tag}` })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  },
};
