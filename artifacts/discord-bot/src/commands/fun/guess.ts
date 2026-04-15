import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const activeGames = new Map<string, { number: number; attempts: number; max: number }>();

export default {
  data: new SlashCommandBuilder()
    .setName("guess")
    .setDescription("🎯 Guess the number game!")
    .addStringOption((opt) =>
      opt.setName("action").setDescription("Start a new game or guess a number").setRequired(true)
        .addChoices({ name: "🎮 Start New Game", value: "start" }, { name: "🔢 Make a Guess", value: "guess" })
    )
    .addIntegerOption((opt) => opt.setName("number").setDescription("Your guess (1-1000)").setMinValue(1).setMaxValue(1000)),

  async execute(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString("action", true);
    const key = `${interaction.user.id}-${interaction.guildId}`;

    if (action === "start") {
      const number = Math.floor(Math.random() * 1000) + 1;
      activeGames.set(key, { number, attempts: 0, max: 10 });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎯 Number Guessing Game Started!")
        .setDescription("I've picked a number between **1 and 1000**.\nYou have **10 attempts** to guess it!")
        .addFields({ name: "📝 How to play", value: "Use `/guess action:Make a Guess number:<your number>` to guess!" })
        .setFooter({ text: "RYZENX™ Games" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (action === "guess") {
      const game = activeGames.get(key);
      if (!game) return interaction.reply({ content: "❌ You don't have an active game! Start one with `/guess action:Start New Game`", ephemeral: true });

      const guess = interaction.options.getInteger("number");
      if (!guess) return interaction.reply({ content: "❌ Please provide a number to guess!", ephemeral: true });

      game.attempts++;
      const remaining = game.max - game.attempts;

      if (guess === game.number) {
        activeGames.delete(key);
        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle("🎉 Correct!")
          .setDescription(`The number was **${game.number}**!\nYou got it in **${game.attempts}** attempt${game.attempts !== 1 ? "s" : ""}!`)
          .setFooter({ text: "RYZENX™ Games" }).setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      if (remaining <= 0) {
        activeGames.delete(key);
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("❌ Game Over!")
          .setDescription(`Out of attempts! The number was **${game.number}**.`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      const hint = guess < game.number ? "📈 Higher!" : "📉 Lower!";
      const embed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle(`🎯 ${hint}`)
        .setDescription(`Your guess: **${guess}**\nAttempts left: **${remaining}**`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  },
};
