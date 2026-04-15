import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios from "axios";

export default {
  data: new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Get a random joke")
    .addStringOption((opt) =>
      opt.setName("category").setDescription("Joke category").addChoices(
        { name: "Any", value: "Any" },
        { name: "Programming", value: "Programming" },
        { name: "Misc", value: "Misc" },
        { name: "Pun", value: "Pun" },
        { name: "Dark", value: "Dark" },
      )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString("category") || "Any";
    await interaction.deferReply();

    try {
      const res = await axios.get(`https://v2.jokeapi.dev/joke/${category}?safe-mode`);
      const joke = res.data;
      const text = joke.type === "twopart" ? `${joke.setup}\n\n||${joke.delivery}||` : joke.joke;

      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("😂 Random Joke")
        .setDescription(text)
        .setFooter({ text: `Category: ${joke.category}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply("❌ Failed to fetch a joke. Try again later.");
    }
  },
};
