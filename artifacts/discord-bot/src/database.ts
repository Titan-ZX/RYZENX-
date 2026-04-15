import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.BOT_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.BOT_DATABASE_URL?.includes("sslmode=disable")
    ? false
    : { rejectUnauthorized: false },
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        prefix TEXT DEFAULT '!',
        automod_enabled BOOLEAN DEFAULT false,
        word_filter TEXT[] DEFAULT '{}',
        link_filter BOOLEAN DEFAULT false,
        anti_spam BOOLEAN DEFAULT false,
        spam_threshold INTEGER DEFAULT 5,
        caps_limit INTEGER DEFAULT 70,
        mention_limit INTEGER DEFAULT 5,
        anti_raid BOOLEAN DEFAULT false,
        raid_threshold INTEGER DEFAULT 10,
        log_channel TEXT,
        welcome_channel TEXT,
        welcome_message TEXT DEFAULT 'Welcome to the server, {user}!',
        goodbye_channel TEXT,
        goodbye_message TEXT DEFAULT 'Goodbye, {user}!',
        autorole TEXT,
        starboard_channel TEXT,
        starboard_threshold INTEGER DEFAULT 3,
        suggestion_channel TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_levels (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 0,
        total_messages INTEGER DEFAULT 0,
        last_message_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, guild_id)
      );

      CREATE TABLE IF NOT EXISTS warnings (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message TEXT NOT NULL,
        remind_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reaction_roles (
        guild_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (message_id, emoji)
      );

      CREATE TABLE IF NOT EXISTS starboard (
        original_message_id TEXT PRIMARY KEY,
        starboard_message_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        star_count INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS giveaways (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        message_id TEXT,
        host_id TEXT NOT NULL,
        prize TEXT NOT NULL,
        winners INTEGER DEFAULT 1,
        ends_at TIMESTAMP NOT NULL,
        ended BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS giveaway_entries (
        id SERIAL PRIMARY KEY,
        giveaway_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        entered_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (giveaway_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS economy (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        wallet BIGINT DEFAULT 0,
        bank BIGINT DEFAULT 0,
        last_daily TIMESTAMP,
        last_work TIMESTAMP,
        daily_streak INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, guild_id)
      );
    `);
    console.log("[DB] Database initialized successfully");
  } finally {
    client.release();
  }
}

export async function getGuildSettings(guildId: string) {
  const result = await pool.query(
    "SELECT * FROM guild_settings WHERE guild_id = $1",
    [guildId]
  );
  if (result.rows.length === 0) {
    await pool.query(
      "INSERT INTO guild_settings (guild_id) VALUES ($1) ON CONFLICT DO NOTHING",
      [guildId]
    );
    const newResult = await pool.query(
      "SELECT * FROM guild_settings WHERE guild_id = $1",
      [guildId]
    );
    return newResult.rows[0];
  }
  return result.rows[0];
}

export async function updateGuildSettings(guildId: string, updates: Record<string, any>) {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
  await pool.query(
    `UPDATE guild_settings SET ${setClause}, updated_at = NOW() WHERE guild_id = $1`,
    [guildId, ...values]
  );
}

export { pool };
