import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const responses = [
  "It is certain.", "It is decidedly so.", "Without a doubt.", "Yes definitely.",
  "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.",
  "Yes.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.",
  "Better not tell you now.", "Cannot predict now.", "Concentrate and ask again.",
  "Don't count on it.", "My reply is no.", "My sources say no.",
  "Outlook not so good.", "Very doubtful.",
];

export default {
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question")
    .addStringOption((opt) => opt.setName("question").setDescription("Your question").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);
    const response = responses[Math.floor(Math.random() * responses.length)];
    const isPositive = responses.indexOf(response) < 10;
    const isNeutral = responses.indexOf(response) >= 10 && responses.indexOf(response) < 15;

    const embed = new EmbedBuilder()
      .setColor(isPositive ? 0x00ff00 : isNeutral ? 0xffaa00 : 0xff0000)
      .setTitle("🎱 Magic 8-Ball")
      .addFields(
        { name: "Question", value: question },
        { name: "Answer", value: response },
      )
      .setFooter({ text: `Asked by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
