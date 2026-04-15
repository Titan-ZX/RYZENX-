import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import axios from "axios";

export default {
  data: new SlashCommandBuilder()
    .setName("trivia")
    .setDescription("🧠 Answer a trivia question")
    .addStringOption((opt) =>
      opt.setName("category").setDescription("Category").addChoices(
        { name: "General Knowledge", value: "9" },
        { name: "Science", value: "17" },
        { name: "Computers", value: "18" },
        { name: "Mathematics", value: "19" },
        { name: "Sports", value: "21" },
        { name: "History", value: "23" },
        { name: "Geography", value: "22" },
      )
    )
    .addStringOption((opt) =>
      opt.setName("difficulty").setDescription("Difficulty").addChoices(
        { name: "Easy", value: "easy" },
        { name: "Medium", value: "medium" },
        { name: "Hard", value: "hard" },
      )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString("category") || "";
    const difficulty = interaction.options.getString("difficulty") || "medium";
    await interaction.deferReply();

    try {
      const url = `https://opentdb.com/api.php?amount=1&type=multiple&difficulty=${difficulty}${category ? `&category=${category}` : ""}`;
      const res = await axios.get(url, { timeout: 5000 });
      const q = res.data.results[0];

      const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
      const question = decode(q.question);
      const correct = decode(q.correct_answer);
      const incorrect = q.incorrect_answers.map(decode);
      const answers = [...incorrect, correct].sort(() => Math.random() - 0.5);

      const letters = ["🇦", "🇧", "🇨", "🇩"];
      const correctIdx = answers.indexOf(correct);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("🧠 Trivia Question!")
        .setDescription(question)
        .addFields(
          answers.map((a, i) => ({ name: `${letters[i]} ${a}`, value: "\u200B", inline: true }))
        )
        .addFields({ name: "⏰ Category / Difficulty", value: `${decode(q.category)} | ${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}`, inline: false })
        .setFooter({ text: `Correct answer will be revealed in 15 seconds | RYZENX™` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        answers.map((_, i) =>
          new ButtonBuilder().setCustomId(`trivia_skip`).setLabel(letters[i].replace("🇦", "A").replace("🇧", "B").replace("🇨", "C").replace("🇩", "D")[0] || String.fromCharCode(65 + i)).setStyle(ButtonStyle.Secondary)
        )
      );

      await interaction.editReply({ embeds: [embed] });

      setTimeout(async () => {
        const revealEmbed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle("🧠 Trivia — Answer Revealed!")
          .setDescription(question)
          .addFields(
            answers.map((a, i) => ({
              name: `${letters[i]} ${a}`,
              value: i === correctIdx ? "✅ **CORRECT!**" : "❌",
              inline: true,
            }))
          )
          .setFooter({ text: "RYZENX™ Trivia System" })
          .setTimestamp();

        await interaction.editReply({ embeds: [revealEmbed], components: [] });
      }, 15000);
    } catch {
      await interaction.editReply("❌ Failed to fetch trivia question. Try again!");
    }
  },
};
