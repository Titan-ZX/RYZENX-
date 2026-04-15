import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import axios from "axios";

const actions: Record<string, { text: (user: string, target: string) => string; emoji: string; color: number; solo?: string }> = {
  hug: { text: (u, t) => `**${u}** hugs **${t}** 🤗`, emoji: "🤗", color: 0xff99cc, solo: "hugging themselves" },
  pat: { text: (u, t) => `**${u}** pats **${t}** on the head 😊`, emoji: "😊", color: 0xffcc99, solo: "pats themselves" },
  slap: { text: (u, t) => `**${u}** slaps **${t}** 👋`, emoji: "👋", color: 0xff4444, solo: "slaps themselves???" },
  kiss: { text: (u, t) => `**${u}** kisses **${t}** 💋`, emoji: "💋", color: 0xff6699, solo: "blows a kiss" },
  poke: { text: (u, t) => `**${u}** pokes **${t}** 👉`, emoji: "👉", color: 0xffff99, solo: "pokes the air" },
  wave: { text: (u, t) => `**${u}** waves at **${t}** 👋`, emoji: "👋", color: 0x99ccff, solo: "waves hello!" },
  cry: { text: (u, t) => `**${u}** cries because of **${t}** 😭`, emoji: "😭", color: 0x6699ff, solo: "is crying 😭" },
  cuddle: { text: (u, t) => `**${u}** cuddles **${t}** 🥰`, emoji: "🥰", color: 0xff99ff, solo: "cuddles a pillow" },
  dance: { text: (u, t) => `**${u}** dances with **${t}** 💃`, emoji: "💃", color: 0x9966ff, solo: "is dancing!" },
  highfive: { text: (u, t) => `**${u}** high-fives **${t}** 🙌`, emoji: "🙌", color: 0x66ff99, solo: "high-fives the air" },
  bite: { text: (u, t) => `**${u}** bites **${t}** 😈`, emoji: "😈", color: 0xff3333, solo: "bites themselves?!" },
  blush: { text: (u, t) => `**${u}** blushes at **${t}** ☺️`, emoji: "☺️", color: 0xff99cc, solo: "is blushing 😳" },
  wink: { text: (u, t) => `**${u}** winks at **${t}** 😉`, emoji: "😉", color: 0xffff66, solo: "winks" },
  boop: { text: (u, t) => `**${u}** boops **${t}**'s nose 👆`, emoji: "👆", color: 0xffccff, solo: "boops the air" },
  facepalm: { text: (u, t) => `**${u}** facepalms at **${t}** 🤦`, emoji: "🤦", color: 0x888888, solo: "facepalms 🤦" },
  nuzzle: { text: (u, t) => `**${u}** nuzzles **${t}** 💕`, emoji: "💕", color: 0xff88cc, solo: "nuzzles a plushie" },
};

const gifTypes: Record<string, string> = {
  hug: "hug", pat: "pat", slap: "slap", kiss: "kiss", poke: "poke",
  wave: "wave", cry: "cry", cuddle: "cuddle", dance: "dance",
  highfive: "highfive", bite: "bite", blush: "blush", wink: "wink",
  boop: "boop", facepalm: "facepalm", nuzzle: "nuzzle",
};

async function getGif(type: string): Promise<string | null> {
  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${type}`, { timeout: 3000 });
    return res.data?.url || null;
  } catch {
    return null;
  }
}

const subcommandBuilder = (sub: any, name: string, emoji: string) =>
  sub.setName(name).setDescription(`${emoji} Perform the ${name} action`)
    .addUserOption((opt: any) => opt.setName("user").setDescription("Target user").setRequired(false));

export default {
  data: new SlashCommandBuilder()
    .setName("social")
    .setDescription("💕 Social interaction commands")
    .addSubcommand((sub) => subcommandBuilder(sub, "hug", "🤗"))
    .addSubcommand((sub) => subcommandBuilder(sub, "pat", "😊"))
    .addSubcommand((sub) => subcommandBuilder(sub, "slap", "👋"))
    .addSubcommand((sub) => subcommandBuilder(sub, "kiss", "💋"))
    .addSubcommand((sub) => subcommandBuilder(sub, "poke", "👉"))
    .addSubcommand((sub) => subcommandBuilder(sub, "wave", "👋"))
    .addSubcommand((sub) => subcommandBuilder(sub, "cry", "😭"))
    .addSubcommand((sub) => subcommandBuilder(sub, "cuddle", "🥰"))
    .addSubcommand((sub) => subcommandBuilder(sub, "dance", "💃"))
    .addSubcommand((sub) => subcommandBuilder(sub, "highfive", "🙌"))
    .addSubcommand((sub) => subcommandBuilder(sub, "bite", "😈"))
    .addSubcommand((sub) => subcommandBuilder(sub, "blush", "☺️"))
    .addSubcommand((sub) => subcommandBuilder(sub, "wink", "😉"))
    .addSubcommand((sub) => subcommandBuilder(sub, "boop", "👆"))
    .addSubcommand((sub) => subcommandBuilder(sub, "facepalm", "🤦"))
    .addSubcommand((sub) => subcommandBuilder(sub, "nuzzle", "💕")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const action = actions[sub];
    if (!action) return;

    const target = interaction.options.getUser("user");
    const username = interaction.user.username;
    const targetName = target?.username || action.solo;

    await interaction.deferReply();

    const gifType = gifTypes[sub] || sub;
    const gifUrl = await getGif(gifType);

    const embed = new EmbedBuilder()
      .setColor(action.color)
      .setDescription(`${action.emoji} ${action.text(username, targetName!)}`)
      .setFooter({ text: "RYZENX™ Social System" })
      .setTimestamp();

    if (gifUrl) embed.setImage(gifUrl);

    await interaction.editReply({ embeds: [embed] });
  },
};
