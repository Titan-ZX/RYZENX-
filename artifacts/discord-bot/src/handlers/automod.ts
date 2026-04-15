import { Message, EmbedBuilder, TextChannel, GuildMember } from "discord.js";
import { getGuildSettings, pool } from "../database";

const urlRegex = /https?:\/\/[^\s]+/gi;
const violationMap = new Map<string, { count: number; resetAt: number }>();

async function getViolationCount(userId: string, guildId: string): Promise<number> {
  const key = `${guildId}-${userId}`;
  const now = Date.now();
  const data = violationMap.get(key);

  if (!data || now > data.resetAt) {
    const result = await pool.query(
      "SELECT COUNT(*) FROM warnings WHERE user_id = $1 AND guild_id = $2 AND created_at > NOW() - INTERVAL '1 hour'",
      [userId, guildId]
    );
    const count = parseInt(result.rows[0].count);
    violationMap.set(key, { count, resetAt: now + 300000 });
    return count;
  }
  return data.count;
}

async function escalate(message: Message, violations: number) {
  const member = message.member;
  if (!member || member.permissions.has("Administrator")) return;

  if (violations >= 7) {
    await pool.query(
      "INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4)",
      [message.author.id, message.guild!.id, message.client.user!.id, "🤖 Auto-ban: Repeated violations"]
    );
    await message.guild!.bans.create(message.author.id, { reason: "RYZENX™ Auto-ban: Repeated automod violations" }).catch(() => {});
    await logEscalation(message, "🔨 AUTO-BAN", "Exceeded violation threshold (7+)", 0xff0000);
  } else if (violations >= 5) {
    await member.timeout(60 * 60 * 1000, "RYZENX™ Auto-timeout: Repeated violations").catch(() => {});
    await pool.query(
      "INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4)",
      [message.author.id, message.guild!.id, message.client.user!.id, "🤖 Auto-timeout 1hr: Repeated violations"]
    );
    await logEscalation(message, "⏱️ AUTO-TIMEOUT (1hr)", "5+ violations in last hour", 0xff6600);
  } else if (violations >= 3) {
    await member.timeout(10 * 60 * 1000, "RYZENX™ Auto-timeout: Multiple violations").catch(() => {});
    await pool.query(
      "INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4)",
      [message.author.id, message.guild!.id, message.client.user!.id, "🤖 Auto-timeout 10min: Multiple violations"]
    );
    await logEscalation(message, "⏱️ AUTO-TIMEOUT (10min)", "3+ violations in last hour", 0xffaa00);
  }
}

async function logEscalation(message: Message, action: string, reason: string, color: number) {
  try {
    const settings = await getGuildSettings(message.guild!.id);
    if (!settings.log_channel) return;
    const logChannel = message.guild!.channels.cache.get(settings.log_channel) as TextChannel;
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`🤖 RYZENX™ Auto-Escalation: ${action}`)
      .addFields(
        { name: "👤 User", value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: "📋 Reason", value: reason, inline: true },
        { name: "📍 Channel", value: `${message.channel}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Security System" })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch {}
}

export async function handleAutomod(
  message: Message,
  spamMap: Map<string, { count: number; lastMessage: number }>
) {
  if (!message.guild || !message.member) return;
  if (message.member.permissions.has("Administrator")) return;

  const settings = await getGuildSettings(message.guild.id);
  if (!settings.automod_enabled) return;

  const key = `${message.guild.id}-${message.author.id}`;
  let triggered = false;
  let violationReason = "";

  if (settings.word_filter && settings.word_filter.length > 0) {
    const content = message.content.toLowerCase();
    const blocked = settings.word_filter.some((word: string) => content.includes(word.toLowerCase()));
    if (blocked) {
      await message.delete().catch(() => {});
      triggered = true;
      violationReason = "Word filter violation";
    }
  }

  if (!triggered && settings.link_filter) {
    if (urlRegex.test(message.content)) {
      urlRegex.lastIndex = 0;
      await message.delete().catch(() => {});
      triggered = true;
      violationReason = "Link filter violation";
    }
    urlRegex.lastIndex = 0;
  }

  if (!triggered && settings.caps_limit && message.content.length > 10) {
    const letters = message.content.replace(/[^A-Za-z]/g, "");
    const upper = letters.split("").filter((c) => c === c.toUpperCase()).length;
    if (letters.length > 0 && (upper / letters.length) * 100 > settings.caps_limit) {
      await message.delete().catch(() => {});
      triggered = true;
      violationReason = "Caps filter violation";
    }
  }

  if (!triggered && settings.mention_limit) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > settings.mention_limit) {
      await message.delete().catch(() => {});
      triggered = true;
      violationReason = "Mention spam violation";
    }
  }

  if (settings.anti_spam) {
    const now = Date.now();
    const userData = spamMap.get(key) || { count: 0, lastMessage: now };
    if (now - userData.lastMessage < 3000) {
      userData.count++;
    } else {
      userData.count = 1;
    }
    userData.lastMessage = now;
    spamMap.set(key, userData);

    if (userData.count >= settings.spam_threshold) {
      if (!triggered) await message.delete().catch(() => {});
      triggered = true;
      violationReason = "Spam violation";
      spamMap.set(key, { count: 0, lastMessage: now });
    }
  }

  if (triggered) {
    await pool.query(
      "INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4)",
      [message.author.id, message.guild.id, message.client.user!.id, `🤖 Automod: ${violationReason}`]
    );

    const violations = await getViolationCount(message.author.id, message.guild.id);

    try {
      const embed = new EmbedBuilder()
        .setColor(0xff4400)
        .setTitle("🛡️ RYZENX™ Automod")
        .setDescription(`Your message was removed.\n**Reason:** ${violationReason}`)
        .addFields({ name: "⚠️ Violations (last hour)", value: `${violations + 1}` })
        .setFooter({ text: "Repeated violations lead to automatic escalation" })
        .setTimestamp();

      const dm = await message.author.createDM().catch(() => null);
      if (dm) await dm.send({ embeds: [embed] }).catch(() => {});
    } catch {}

    const updatedViolations = (await getViolationCount(message.author.id, message.guild.id)) + 1;
    const cacheKey = `${message.guild.id}-${message.author.id}`;
    violationMap.set(cacheKey, { count: updatedViolations, resetAt: Date.now() + 300000 });

    await escalate(message, updatedViolations);
  }
}
