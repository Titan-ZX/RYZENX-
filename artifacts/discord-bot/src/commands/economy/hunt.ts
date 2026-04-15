import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const PREY = [
  { name: "🐇 Rabbit", min: 30, max: 100, chance: 35 },
  { name: "🦊 Fox", min: 100, max: 250, chance: 25 },
  { name: "🦌 Deer", min: 200, max: 450, chance: 20 },
  { name: "🐗 Wild Boar", min: 350, max: 700, chance: 12 },
  { name: "🦁 Lion", min: 800, max: 1800, chance: 6 },
  { name: "🐉 Dragon", min: 3000, max: 8000, chance: 2 },
];
const MISS = ["You missed! 🏹 The animal ran away.", "Your arrow flew past! Try again.", "The animal was too fast!", "You tripped and scared it away!"];
const COOLDOWN = 45 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("🏹 Go hunting and earn coins!"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = Date.now();
    if (eco.last_hunt && now - new Date(eco.last_hunt).getTime() < COOLDOWN) {
      const left = Math.ceil((COOLDOWN - (now - new Date(eco.last_hunt).getTime())) / 1000);
      return interaction.reply({ content: `🏹 You need to reload! Wait **${left}s**.`, ephemeral: true });
    }

    const rand = Math.random() * 100;
    let cumulative = 0, caught = null;
    for (const p of PREY) { cumulative += p.chance; if (rand <= cumulative) { caught = p; break; } }

    await pool.query("UPDATE economy SET last_hunt = NOW() WHERE user_id = $1 AND guild_id = $2", [interaction.user.id, interaction.guild!.id]);

    if (!caught) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x888888).setTitle("🏹 Hunting Trip").setDescription(MISS[Math.floor(Math.random() * MISS.length)])] });
    }

    const earned = Math.floor(Math.random() * (caught.max - caught.min + 1) + caught.min);
    await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [earned, interaction.user.id, interaction.guild!.id]);

    const embed = new EmbedBuilder()
      .setColor(0x886633)
      .setTitle("🏹 Hunting Results!")
      .setDescription(`You tracked and hunted a **${caught.name}**!`)
      .addFields(
        { name: "💰 Earned", value: `🪙 ${earned.toLocaleString()}`, inline: true },
        { name: "⏰ Cooldown", value: "45 seconds", inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
