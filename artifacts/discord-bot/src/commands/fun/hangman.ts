import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

const words = ["javascript", "python", "discord", "keyboard", "elephant", "mountain", "library", "computer",
  "adventure", "sunshine", "butterfly", "telescope", "strawberry", "chocolate", "crocodile",
  "symphony", "universe", "algorithm", "waterfall", "magnificent"];

const STAGES = ["```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"];

export default {
  data: new SlashCommandBuilder()
    .setName("hangman")
    .setDescription("🪢 Play Hangman!")
    .addStringOption((opt) =>
      opt.setName("action").setDescription("Action").setRequired(true)
        .addChoices({ name: "▶️ Start Game", value: "start" }, { name: "🔤 Guess Letter", value: "guess" }, { name: "🏳️ Give Up", value: "giveup" })
    )
    .addStringOption((opt) => opt.setName("letter").setDescription("A letter to guess").setMaxLength(1)),

  async execute(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString("action", true);
    const channelId = interaction.channelId;

    if (action === "start") {
      const existing = await pool.query("SELECT 1 FROM hangman_games WHERE channel_id = $1", [channelId]);
      if (existing.rows.length) return interaction.reply({ content: "❌ There's already a hangman game in this channel! Use `/hangman action:Guess Letter` to play.", ephemeral: true });

      const word = words[Math.floor(Math.random() * words.length)];
      await pool.query(
        "INSERT INTO hangman_games (channel_id, word, user_id) VALUES ($1, $2, $3) ON CONFLICT (channel_id) DO UPDATE SET word = $2, guessed = '{}', wrong = 0, user_id = $3",
        [channelId, word, interaction.user.id]
      );

      const display = word.split("").map(() => "\\_").join(" ");
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🪢 Hangman Started!")
        .setDescription(STAGES[0])
        .addFields(
          { name: "Word", value: display, inline: true },
          { name: "Letters left", value: `${word.length} letters`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Hangman • Use /hangman action:Guess Letter to play!" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const game = await pool.query("SELECT * FROM hangman_games WHERE channel_id = $1", [channelId]);

    if (action === "giveup") {
      if (!game.rows.length) return interaction.reply({ content: "❌ No active game.", ephemeral: true });
      const word = game.rows[0].word;
      await pool.query("DELETE FROM hangman_games WHERE channel_id = $1", [channelId]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("🏳️ Game Over!").setDescription(`You gave up! The word was **${word}**.`)] });
    }

    if (action === "guess") {
      if (!game.rows.length) return interaction.reply({ content: "❌ No active game in this channel. Start one with `/hangman action:Start Game`", ephemeral: true });
      const letter = interaction.options.getString("letter")?.toLowerCase();
      if (!letter || !/^[a-z]$/.test(letter)) return interaction.reply({ content: "❌ Please provide a single letter a-z.", ephemeral: true });

      const { word, guessed, wrong } = game.rows[0];
      if (guessed.includes(letter)) return interaction.reply({ content: `❌ You already guessed **${letter}**!`, ephemeral: true });

      const newGuessed = [...guessed, letter];
      const correct = word.includes(letter);
      const newWrong = wrong + (correct ? 0 : 1);

      await pool.query("UPDATE hangman_games SET guessed = $1, wrong = $2 WHERE channel_id = $3", [newGuessed, newWrong, channelId]);

      const display = word.split("").map((c: string) => newGuessed.includes(c) ? c : "\\_").join(" ");
      const won = !display.includes("\\_");

      if (won || newWrong >= 6) {
        await pool.query("DELETE FROM hangman_games WHERE channel_id = $1", [channelId]);
        const embed = new EmbedBuilder()
          .setColor(won ? 0x00ff88 : 0xff0000)
          .setTitle(won ? "🎉 You Won!" : "💀 Game Over!")
          .setDescription(won ? `You guessed **${word}**! Congratulations!` : `${STAGES[6]}\nThe word was **${word}**!`)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(correct ? 0x00ff88 : 0xff6600)
        .setTitle(`🪢 Hangman — ${correct ? "✅ Correct!" : "❌ Wrong!"}`)
        .setDescription(STAGES[newWrong])
        .addFields(
          { name: "Word", value: display, inline: true },
          { name: "Wrong Guesses", value: `${newWrong}/6`, inline: true },
          { name: "Guessed Letters", value: newGuessed.join(", ") || "None", inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
