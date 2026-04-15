import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const truths = [
  "What's the most embarrassing thing you've done?","Have you ever lied to get out of trouble? What was it?",
  "What's your biggest fear?","Who do you have a secret crush on?","What's the worst thing you've ever done?",
  "Have you ever cheated on a test?","What's a secret you've never told anyone?","What was your most embarrassing moment?",
  "Have you ever pretended to be sick to avoid something?","What's the most childish thing you still do?",
  "What's the weirdest thing you've ever eaten?","Have you ever stolen anything?","What's your guilty pleasure?",
  "What's the most embarrassing song on your playlist?","Have you ever ghosted someone?",
  "What's your biggest regret?","What's the strangest dream you've had?","Do you have any weird phobias?",
  "What's the most trouble you've been in at school/work?","Have you ever lied about your age?",
];

const dares = [
  "Do your best impression of a famous person for 1 minute.",
  "Text the 10th contact in your phone a random emoji.",
  "Speak in an accent for the next 5 minutes.",
  "Do 20 jumping jacks right now.",
  "Let someone else post something on your social media.",
  "Talk without using the letter 'S' for 2 minutes.",
  "Describe the last photo on your phone without showing it.",
  "Sing the chorus of a song chosen by someone else.",
  "Call a random contact and say 'I know what you did last summer.'",
  "Type a status saying 'I love pickles' on your social media.",
  "Do your best robot dance for 30 seconds.",
  "Speak only in questions for the next 3 minutes.",
  "Say the alphabet backwards as fast as you can.",
  "Act like a penguin for the rest of the game.",
  "Make up a rap about someone in the chat.",
  "Change your profile picture to something silly for an hour.",
  "Write a haiku about the last person who messaged you.",
  "Say 10 positive affirmations out loud.",
  "Do your best celebrity impression.",
  "Let someone draw on your profile photo (photoshop edition).",
];

export default {
  data: new SlashCommandBuilder()
    .setName("truthordare")
    .setDescription("🎭 Get a random truth or dare!")
    .addStringOption((opt) =>
      opt.setName("type").setDescription("Truth or Dare").setRequired(true)
        .addChoices({ name: "Truth", value: "truth" }, { name: "Dare", value: "dare" })
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString("type", true);
    const isT = type === "truth";
    const list = isT ? truths : dares;
    const item = list[Math.floor(Math.random() * list.length)];

    const embed = new EmbedBuilder()
      .setColor(isT ? 0x00aaff : 0xff4444)
      .setTitle(isT ? "🤔 TRUTH" : "😈 DARE")
      .setDescription(`> ${item}`)
      .setFooter({ text: `Requested by ${interaction.user.username} • RYZENX™` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
