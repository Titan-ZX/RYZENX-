import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios from "axios";

export default {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Get a random meme from Reddit"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const subreddits = ["memes", "dankmemes", "ProgrammerHumor", "AdviceAnimals"];
    const sub = subreddits[Math.floor(Math.random() * subreddits.length)];

    try {
      const res = await axios.get(`https://www.reddit.com/r/${sub}/random.json?limit=1`, {
        headers: { "User-Agent": "DiscordBot/1.0" },
      });

      const post = res.data[0].data.children[0].data;
      if (!post.url || post.over_18) {
        return interaction.editReply("❌ Couldn't find a suitable meme. Try again!");
      }

      const embed = new EmbedBuilder()
        .setColor(0xff4500)
        .setTitle(post.title)
        .setImage(post.url)
        .setURL(`https://reddit.com${post.permalink}`)
        .setFooter({ text: `👍 ${post.ups} | 💬 ${post.num_comments} | r/${sub}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply("❌ Failed to fetch a meme. Reddit might be down!");
    }
  },
};
