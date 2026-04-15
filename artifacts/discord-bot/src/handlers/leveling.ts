import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { pool } from "../database";

const xpCooldowns = new Map<string, number>();

export async function handleLeveling(message: Message) {
  if (!message.guild) return;

  const key = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();
  const cooldown = xpCooldowns.get(key) || 0;

  if (now - cooldown < 60000) return;
  xpCooldowns.set(key, now);

  const xpGain = Math.floor(Math.random() * 10) + 15;

  const result = await pool.query(
    `INSERT INTO user_levels (user_id, guild_id, xp, level, total_messages)
     VALUES ($1, $2, $3, 0, 1)
     ON CONFLICT (user_id, guild_id)
     DO UPDATE SET xp = user_levels.xp + $3, total_messages = user_levels.total_messages + 1, last_message_at = NOW()
     RETURNING *`,
    [message.author.id, message.guild.id, xpGain]
  );

  const user = result.rows[0];
  const newLevel = calculateLevel(user.xp);

  if (newLevel > user.level) {
    await pool.query(
      "UPDATE user_levels SET level = $1 WHERE user_id = $2 AND guild_id = $3",
      [newLevel, message.author.id, message.guild.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("🎉 Level Up!")
      .setDescription(`Congratulations ${message.author}, you reached **Level ${newLevel}**!`)
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp();

    await (message.channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
  }
}

export function calculateLevel(xp: number): number {
  return Math.floor(0.1 * Math.sqrt(xp));
}

export function xpForLevel(level: number): number {
  return Math.pow(level / 0.1, 2);
}
