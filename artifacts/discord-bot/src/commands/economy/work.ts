import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const COOLDOWN_MS = 60 * 60 * 1000;
const jobs = [
  { job: "Software Engineer", earn: [400, 800], msg: "You shipped a feature and got paid." },
  { job: "Security Analyst", earn: [350, 750], msg: "You blocked a breach and earned a bonus." },
  { job: "Discord Mod", earn: [200, 500], msg: "You banned 50 raiders and got your paycheck." },
  { job: "Crypto Trader", earn: [100, 1200], msg: "You timed the market. Risky but rewarding." },
  { job: "AI Researcher", earn: [500, 900], msg: "You trained a model and published a paper." },
  { job: "Bug Bounty Hunter", earn: [300, 1000], msg: "You found a critical vuln and claimed the bounty." },
  { job: "Game Developer", earn: [250, 600], msg: "Your indie game made its first sales." },
  { job: "Data Scientist", earn: [400, 700], msg: "Your data pipeline ran flawlessly." },
];

export default {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("💼 Work for coins (1h cooldown)"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = new Date();
    const lastWork = eco.last_work ? new Date(eco.last_work) : null;

    if (lastWork && now.getTime() - lastWork.getTime() < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now.getTime() - lastWork.getTime());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("⏰ Already Working")
        .setDescription(`You need to rest! Come back in **${minutes}m ${seconds}s**.`)
        .setFooter({ text: "RYZENX™ Economy System" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const earned = Math.floor(Math.random() * (job.earn[1] - job.earn[0] + 1)) + job.earn[0];

    await pool.query(
      "UPDATE economy SET wallet = wallet + $1, last_work = NOW() WHERE user_id = $2 AND guild_id = $3",
      [earned, interaction.user.id, interaction.guild!.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle(`💼 Job: ${job.job}`)
      .setDescription(`*${job.msg}*\n\nYou earned **🪙 ${earned.toLocaleString()} coins**!`)
      .addFields({ name: "👛 Wallet", value: `🪙 ${(eco.wallet + earned).toLocaleString()}`, inline: true })
      .setFooter({ text: "RYZENX™ Economy • Work again in 1 hour" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
