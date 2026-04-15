import { pool } from "../database";

export async function getOrCreateEconomy(userId: string, guildId: string) {
  const result = await pool.query(
    "SELECT * FROM economy WHERE user_id = $1 AND guild_id = $2",
    [userId, guildId]
  );

  if (result.rows.length === 0) {
    const inserted = await pool.query(
      "INSERT INTO economy (user_id, guild_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
      [userId, guildId]
    );
    if (inserted.rows.length) return inserted.rows[0];
    const retry = await pool.query("SELECT * FROM economy WHERE user_id = $1 AND guild_id = $2", [userId, guildId]);
    return retry.rows[0];
  }

  return result.rows[0];
}
