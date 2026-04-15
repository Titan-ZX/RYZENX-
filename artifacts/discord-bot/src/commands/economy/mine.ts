import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const ORES = [
  { name: "🪨 Stone", min: 10, max: 50, chance: 35 },
  { name: "🔵 Coal", min: 50, max: 150, chance: 28 },
  { name: "⚙️ Iron", min: 100, max: 300, chance: 20 },
  { name: "🥇 Gold", min: 300, max: 700, chance: 10 },
  { name: "💎 Diamond", min: 800, max: 2000, chance: 5 },
  { name: "🌟 Starstone", min: 3000, max: 7000, chance: 2 },
];
const COOLDOWN = 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("mine")
    .setDescription("⛏️ Mine for ores and earn coins!"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = Date.now();
    if (eco.last_mine && now - new Date(eco.last_mine).getTime() < COOLDOWN) {
      const left = Math.ceil((COOLDOWN - (now - new Date(eco.last_mine).getTime())) / 1000);
      return interaction.reply({ content: `⛏️ Your pickaxe is tired! Wait **${left}s**.`, ephemeral: true });
    }

    const rand = Math.random() * 100;
    let cumulative = 0, found = null;
    for (const o of ORES) { cumulative += o.chance; if (rand <= cumulative) { found = o; break; } }

    await pool.query("UPDATE economy SET last_mine = NOW() WHERE user_id = $1 AND guild_id = $2", [interaction.user.id, interaction.guild!.id]);

    const ore = found || ORES[0];
    const earned = Math.floor(Math.random() * (ore.max - ore.min + 1) + ore.min);
    await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [earned, interaction.user.id, interaction.guild!.id]);

    const embed = new EmbedBuilder()
      .setColor(0x808080)
      .setTitle("⛏️ Mining Results!")
      .setDescription(`You swung your pickaxe and found **${ore.name}**!`)
      .addFields(
        { name: "💰 Earned", value: `🪙 ${earned.toLocaleString()}`, inline: true },
        { name: "⏰ Cooldown", value: "60 seconds", inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy • 💎 Diamond = jackpot!" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
