import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return val * multipliers[unit];
}

export default {
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Set a reminder")
    .addStringOption((opt) => opt.setName("time").setDescription("Duration (e.g. 10m, 2h, 1d)").setRequired(true))
    .addStringOption((opt) => opt.setName("message").setDescription("What to remind you about").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const timeStr = interaction.options.getString("time", true);
    const message = interaction.options.getString("message", true);

    const ms = parseDuration(timeStr);
    if (!ms) return interaction.reply({ content: "❌ Invalid time format. Use: `10s`, `5m`, `2h`, `1d`", ephemeral: true });
    if (ms > 30 * 24 * 3600000) return interaction.reply({ content: "❌ Reminder cannot be more than 30 days.", ephemeral: true });

    const remindAt = new Date(Date.now() + ms);

    await pool.query(
      "INSERT INTO reminders (user_id, channel_id, message, remind_at) VALUES ($1, $2, $3, $4)",
      [interaction.user.id, interaction.channelId, message, remindAt]
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("⏰ Reminder Set!")
      .addFields(
        { name: "Message", value: message },
        { name: "Reminder At", value: `<t:${Math.floor(remindAt.getTime() / 1000)}:F> (<t:${Math.floor(remindAt.getTime() / 1000)}:R>)` },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
