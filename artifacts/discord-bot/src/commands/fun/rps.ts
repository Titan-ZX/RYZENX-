import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const choices = ["rock", "paper", "scissors"] as const;
const emojis: Record<string, string> = { rock: "🪨", paper: "📄", scissors: "✂️" };

export default {
  data: new SlashCommandBuilder()
    .setName("rps")
    .setDescription("Play rock paper scissors against the bot")
    .addStringOption((opt) =>
      opt.setName("choice").setDescription("Your choice").setRequired(true).addChoices(
        { name: "🪨 Rock", value: "rock" },
        { name: "📄 Paper", value: "paper" },
        { name: "✂️ Scissors", value: "scissors" },
      )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const playerChoice = interaction.options.getString("choice", true) as typeof choices[number];
    const botChoice = choices[Math.floor(Math.random() * 3)];

    let result = "";
    let color = 0xffaa00;

    if (playerChoice === botChoice) {
      result = "It's a tie!";
    } else if (
      (playerChoice === "rock" && botChoice === "scissors") ||
      (playerChoice === "paper" && botChoice === "rock") ||
      (playerChoice === "scissors" && botChoice === "paper")
    ) {
      result = "You win! 🎉";
      color = 0x00ff00;
    } else {
      result = "Bot wins! 🤖";
      color = 0xff0000;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("✊ Rock Paper Scissors")
      .addFields(
        { name: "Your Choice", value: `${emojis[playerChoice]} ${playerChoice}`, inline: true },
        { name: "Bot's Choice", value: `${emojis[botChoice]} ${botChoice}`, inline: true },
        { name: "Result", value: result },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
