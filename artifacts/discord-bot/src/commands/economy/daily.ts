import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const DAILY_AMOUNT = 500;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function streakEmoji(streak: number): string {
  if (streak >= 30) return "🌟";
  if (streak >= 14) return "🔥";
  if (streak >= 7) return "⚡";
  if (streak >= 3) return "✨";
  return "💫";
}

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("🎁 Claim your daily coins — build your streak for bigger bonuses!"),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const now = new Date();
    const lastDaily = eco.last_daily ? new Date(eco.last_daily) : null;

    if (lastDaily && now.getTime() - lastDaily.getTime() < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - (now.getTime() - lastDaily.getTime());
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setAuthor({ name: "Daily Cooldown", iconURL: interaction.user.displayAvatarURL() })
        .setTitle("⏰ Already Claimed Today!")
        .setDescription(`Your daily coins will reset in:\n## ⌛ ${hours}h ${minutes}m ${seconds}s`)
        .addFields(
          { name: "🔥 Current Streak", value: `**${eco.daily_streak || 0}** days`, inline: true },
          { name: "💡 Tip", value: "Keep your streak alive for bigger bonuses!", inline: true },
        )
        .setFooter({ text: "RYZENX™ Economy  •  Come back tomorrow!" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const streak = lastDaily && now.getTime() - lastDaily.getTime() < COOLDOWN_MS * 2 ? (eco.daily_streak || 0) + 1 : 1;
    const bonus = Math.min(streak * 50, 500);
    const total = DAILY_AMOUNT + bonus;
    const emoji = streakEmoji(streak);

    await pool.query(
      "UPDATE economy SET wallet = wallet + $1, last_daily = NOW(), daily_streak = $2 WHERE user_id = $3 AND guild_id = $4",
      [total, streak, interaction.user.id, interaction.guild!.id]
    );

    const nextBonus = Math.min((streak + 1) * 50, 500);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({ name: `${interaction.user.username} claimed daily coins!`, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`${emoji} Daily Claimed!`)
      .setDescription(`## +🪙 ${total.toLocaleString()} coins added to your wallet!`)
      .addFields(
        { name: "💰 Base Reward", value: `🪙 **${DAILY_AMOUNT.toLocaleString()}**`, inline: true },
        { name: "🔥 Streak Bonus", value: `🪙 **+${bonus}**`, inline: true },
        { name: `${emoji} Streak`, value: `**${streak}** day${streak !== 1 ? "s" : ""}`, inline: true },
        { name: "👛 Wallet Now", value: `🪙 **${(eco.wallet + total).toLocaleString()}**`, inline: true },
        { name: "⏭️ Tomorrow's Bonus", value: `🪙 **+${nextBonus}** (keep the streak!)`, inline: true },
      )
      .setFooter({ text: `RYZENX™ Economy  •  Streak max bonus: 🪙 500 at 10 days` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
