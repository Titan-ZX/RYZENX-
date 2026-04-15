import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const RESPONSES = [
  ["A kind stranger gives you 🪙{amount}!", true],
  ["Someone tosses you a few coins: 🪙{amount}", true],
  ["A rich merchant donates 🪙{amount}!", true],
  ["You received 🪙{amount} from a generous passerby!", true],
  ["A mysterious figure slides you 🪙{amount}.", true],
  ["Nobody noticed you. 😢 Better luck next time.", false],
  ["People walked past ignoring you. 🥺", false],
  ["A security guard shoos you away. 😅", false],
  ["You're told to 'get a job!' No coins. 💼", false],
];
const COOLDOWN = 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("🙏 Beg for some coins (60s cooldown)"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = Date.now();
    if (eco.last_beg && now - new Date(eco.last_beg).getTime() < COOLDOWN) {
      const left = Math.ceil((COOLDOWN - (now - new Date(eco.last_beg).getTime())) / 1000);
      return interaction.reply({ content: `🙏 Have some dignity! Wait **${left}s** before begging again.`, ephemeral: true });
    }

    await pool.query("UPDATE economy SET last_beg = NOW() WHERE user_id = $1 AND guild_id = $2", [interaction.user.id, interaction.guild!.id]);

    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    const success = response[1] as boolean;
    const amount = success ? Math.floor(Math.random() * 200) + 10 : 0;

    if (success) {
      await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [amount, interaction.user.id, interaction.guild!.id]);
    }

    const embed = new EmbedBuilder()
      .setColor(success ? 0x00ff88 : 0x888888)
      .setTitle(success ? "🙏 Someone was generous!" : "🙏 Nobody cared...")
      .setDescription((response[0] as string).replace("{amount}", amount.toLocaleString()))
      .setFooter({ text: "RYZENX™ Economy" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
