import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const CATCHES = [
  { name: "🐟 Common Fish", min: 20, max: 80, chance: 40 },
  { name: "🐠 Tropical Fish", min: 80, max: 200, chance: 25 },
  { name: "🐡 Puffer Fish", min: 150, max: 350, chance: 15 },
  { name: "🦈 Shark", min: 500, max: 1200, chance: 8 },
  { name: "🦞 Lobster", min: 300, max: 700, chance: 7 },
  { name: "🦑 Squid", min: 200, max: 500, chance: 4 },
  { name: "💎 Golden Fish", min: 2000, max: 5000, chance: 1 },
];
const NOTHING = ["Got nothing... Try again!", "The fish aren't biting today.", "Empty hook. Bad luck!", "A fish stole your bait!"];
const COOLDOWN = 30 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("🎣 Go fishing and earn coins!"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = Date.now();
    if (eco.last_fish && now - new Date(eco.last_fish).getTime() < COOLDOWN) {
      const left = Math.ceil((COOLDOWN - (now - new Date(eco.last_fish).getTime())) / 1000);
      return interaction.reply({ content: `🎣 You're still fishing! Wait **${left}s** before casting again.`, ephemeral: true });
    }

    const rand = Math.random() * 100;
    let cumulative = 0;
    let caught = null;

    for (const c of CATCHES) {
      cumulative += c.chance;
      if (rand <= cumulative) { caught = c; break; }
    }

    await pool.query("UPDATE economy SET last_fish = NOW() WHERE user_id = $1 AND guild_id = $2", [interaction.user.id, interaction.guild!.id]);

    if (!caught) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x888888).setTitle("🎣 Fishing...").setDescription(NOTHING[Math.floor(Math.random() * NOTHING.length)])] });
    }

    const earned = Math.floor(Math.random() * (caught.max - caught.min + 1) + caught.min);
    await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [earned, interaction.user.id, interaction.guild!.id]);

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🎣 Fishing Results!")
      .setDescription(`You cast your line and caught a **${caught.name}**!`)
      .addFields(
        { name: "💰 Earned", value: `🪙 ${earned.toLocaleString()}`, inline: true },
        { name: "⏰ Next Cast", value: "30 seconds", inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy • Higher rarity = more coins!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
