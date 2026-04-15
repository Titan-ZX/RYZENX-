import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const questions = [
  ["Have the ability to fly", "Have the ability to be invisible"],
  ["Always be hot", "Always be cold"],
  ["Live without music", "Live without TV/movies"],
  ["Be famous but broke", "Be rich but unknown"],
  ["Have no internet for a month", "Have no phone for a month"],
  ["Fight 100 duck-sized horses", "Fight 1 horse-sized duck"],
  ["Never use social media again", "Never watch Netflix again"],
  ["Have unlimited money but no free time", "Have all the free time but be broke"],
  ["Be able to speak all languages", "Be able to play all instruments"],
  ["Know when you'll die", "Know how you'll die"],
  ["Always have to whisper", "Always have to shout"],
  ["Have a rewind button in life", "Have a pause button in life"],
  ["Be 10 years older", "Be 10 years younger"],
  ["Lose all your memories", "Never make new memories"],
  ["Be completely alone for 5 years", "Never be alone for 5 years"],
  ["Have free Wi-Fi everywhere", "Have free food everywhere"],
  ["Go back in time", "Jump to the future"],
  ["Have no fingers", "Have no toes"],
  ["Always be slightly cold", "Always be slightly itchy"],
  ["Give up bathing for a month", "Give up the internet for a month"],
];

export default {
  data: new SlashCommandBuilder()
    .setName("wouldyourather")
    .setDescription("🤔 Get a Would You Rather question?"),

  async execute(interaction: ChatInputCommandInteraction) {
    const q = questions[Math.floor(Math.random() * questions.length)];
    const embed = new EmbedBuilder()
      .setColor(0x9966ff)
      .setTitle("🤔 Would You Rather...")
      .addFields(
        { name: "🅰️ Option A", value: q[0], inline: true },
        { name: "🆚", value: "\u200B", inline: true },
        { name: "🅱️ Option B", value: q[1], inline: true },
      )
      .setDescription("React with 🅰️ or 🅱️ to vote!")
      .setFooter({ text: `RYZENX™ Games • Requested by ${interaction.user.username}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await (msg as any).react("🅰️").catch(() => {});
    await (msg as any).react("🅱️").catch(() => {});
  },
};
