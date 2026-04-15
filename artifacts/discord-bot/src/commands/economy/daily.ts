import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const DAILY_AMOUNT = 500;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("💸 Claim your daily coins (24h cooldown)"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = new Date();
    const lastDaily = eco.last_daily ? new Date(eco.last_daily) : null;

    if (lastDaily && now.getTime() - lastDaily.getTime() < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now.getTime() - lastDaily.getTime());
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("⏰ Daily Already Claimed")
        .setDescription(`You already claimed your daily coins!\n\nCome back in **${hours}h ${minutes}m**.`)
        .setFooter({ text: "RYZENX™ Economy System" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const streak = lastDaily && now.getTime() - lastDaily.getTime() < COOLDOWN_MS * 2 ? (eco.daily_streak || 0) + 1 : 1;
    const bonus = Math.min(streak * 50, 500);
    const total = DAILY_AMOUNT + bonus;

    await pool.query(
      "UPDATE economy SET wallet = wallet + $1, last_daily = NOW(), daily_streak = $2 WHERE user_id = $3 AND guild_id = $4",
      [total, streak, interaction.user.id, interaction.guild!.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🎁 Daily Coins Claimed!")
      .setDescription(`You received **🪙 ${total.toLocaleString()} coins**!`)
      .addFields(
        { name: "💰 Base", value: `🪙 ${DAILY_AMOUNT}`, inline: true },
        { name: "🔥 Streak Bonus", value: `🪙 +${bonus}`, inline: true },
        { name: "📅 Streak", value: `${streak} days`, inline: true },
        { name: "👛 New Wallet", value: `🪙 ${(eco.wallet + total).toLocaleString()}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy • Come back tomorrow for a bigger streak bonus!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
