import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const CRIMES = [
  { name: "🏦 Bank Heist", earnMin: 500, earnMax: 3000, fine: 1000, successRate: 45 },
  { name: "💻 Hack ATM", earnMin: 200, earnMax: 1200, fine: 500, successRate: 55 },
  { name: "🃏 Card Fraud", earnMin: 100, earnMax: 600, fine: 300, successRate: 60 },
  { name: "🚗 Car Theft", earnMin: 300, earnMax: 1500, fine: 600, successRate: 50 },
  { name: "💊 Sell Expired Meds", earnMin: 150, earnMax: 800, fine: 400, successRate: 65 },
  { name: "🎭 Identity Theft", earnMin: 400, earnMax: 2000, fine: 800, successRate: 40 },
];
const COOLDOWN = 2 * 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("crime")
    .setDescription("🦹 Commit a crime for big money (risky!) — 2 min cooldown"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = Date.now();
    if (eco.last_crime && now - new Date(eco.last_crime).getTime() < COOLDOWN) {
      const left = Math.ceil((COOLDOWN - (now - new Date(eco.last_crime).getTime())) / 1000);
      return interaction.reply({ content: `🚔 Lay low for **${left}s** before committing another crime!`, ephemeral: true });
    }

    const crime = CRIMES[Math.floor(Math.random() * CRIMES.length)];
    const success = Math.random() * 100 < crime.successRate;

    await pool.query("UPDATE economy SET last_crime = NOW() WHERE user_id = $1 AND guild_id = $2", [interaction.user.id, interaction.guild!.id]);

    if (success) {
      const earned = Math.floor(Math.random() * (crime.earnMax - crime.earnMin + 1) + crime.earnMin);
      await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [earned, interaction.user.id, interaction.guild!.id]);

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff88).setTitle("🦹 Crime Successful!")
          .setDescription(`You pulled off **${crime.name}** and got away with 🪙 **${earned.toLocaleString()}**!`)
          .setFooter({ text: "RYZENX™ Economy • Crime doesn't always pay... but sometimes it does!" }).setTimestamp()],
      });
    } else {
      const fine = Math.min(eco.wallet, crime.fine);
      await pool.query("UPDATE economy SET wallet = wallet - $1 WHERE user_id = $2 AND guild_id = $3", [fine, interaction.user.id, interaction.guild!.id]);

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("🚔 Busted!")
          .setDescription(`You tried **${crime.name}** but got caught!\nYou paid a fine of 🪙 **${fine.toLocaleString()}**.`)
          .setFooter({ text: "RYZENX™ Economy" }).setTimestamp()],
      });
    }
  },
};
