import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const statements = [
  "Never have I ever stayed up for more than 24 hours.",
  "Never have I ever eaten an entire pizza alone.",
  "Never have I ever been to another country.",
  "Never have I ever fallen asleep in class or at work.",
  "Never have I ever sent a text to the wrong person.",
  "Never have I ever lied about liking a gift.",
  "Never have I ever stalked someone on social media for hours.",
  "Never have I ever pretended not to see someone to avoid talking to them.",
  "Never have I ever accidentally called a teacher/boss 'mom' or 'dad'.",
  "Never have I ever skipped a meal to play video games.",
  "Never have I ever walked into a glass door.",
  "Never have I ever had a food fight.",
  "Never have I ever forgotten someone's birthday.",
  "Never have I ever cried during a movie.",
  "Never have I ever broken something and hid it.",
  "Never have I ever cheated at a board game.",
  "Never have I ever re-gifted a present.",
  "Never have I ever worn the same outfit multiple days in a row.",
  "Never have I ever danced alone in my room.",
  "Never have I ever lied about finishing a book or movie.",
];

export default {
  data: new SlashCommandBuilder()
    .setName("neverhaveiever")
    .setDescription("🍹 Play Never Have I Ever — who's done the most embarrassing things?"),

  async execute(interaction: ChatInputCommandInteraction) {
    const stmt = statements[Math.floor(Math.random() * statements.length)];
    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle("🍹 Never Have I Ever...")
      .setDescription(`> **${stmt}**\n\nReact with 🙋 if you HAVE done this!`)
      .setFooter({ text: `RYZENX™ Games • ${interaction.user.username}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await (msg as any).react("🙋").catch(() => {});
  },
};
