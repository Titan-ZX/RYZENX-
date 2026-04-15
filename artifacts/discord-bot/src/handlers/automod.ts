import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { getGuildSettings } from "../database";

const urlRegex = /https?:\/\/[^\s]+/gi;

export async function handleAutomod(
  message: Message,
  spamMap: Map<string, { count: number; lastMessage: number }>
) {
  if (!message.guild || !message.member) return;
  if (message.member.permissions.has("Administrator")) return;

  const settings = await getGuildSettings(message.guild.id);
  if (!settings.automod_enabled) return;

  const key = `${message.guild.id}-${message.author.id}`;

  if (settings.word_filter && settings.word_filter.length > 0) {
    const content = message.content.toLowerCase();
    const blocked = settings.word_filter.some((word: string) => content.includes(word.toLowerCase()));
    if (blocked) {
      await message.delete().catch(() => {});
      await sendAutomodAlert(message, "🔤 Word Filter", "Your message contained a blocked word.");
      return;
    }
  }

  if (settings.link_filter) {
    if (urlRegex.test(message.content)) {
      urlRegex.lastIndex = 0;
      await message.delete().catch(() => {});
      await sendAutomodAlert(message, "🔗 Link Filter", "Links are not allowed in this server.");
      return;
    }
    urlRegex.lastIndex = 0;
  }

  if (settings.caps_limit && message.content.length > 10) {
    const upperCount = message.content.replace(/[^A-Za-z]/g, "").split("").filter(c => c === c.toUpperCase()).length;
    const total = message.content.replace(/[^A-Za-z]/g, "").length;
    if (total > 0 && (upperCount / total) * 100 > settings.caps_limit) {
      await message.delete().catch(() => {});
      await sendAutomodAlert(message, "🔠 Caps Filter", `Too many capital letters (limit: ${settings.caps_limit}%).`);
      return;
    }
  }

  if (settings.mention_limit) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > settings.mention_limit) {
      await message.delete().catch(() => {});
      await sendAutomodAlert(message, "📢 Mention Spam", `Too many mentions (limit: ${settings.mention_limit}).`);
      return;
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
      await message.delete().catch(() => {});
      await message.member?.timeout(30000, "Anti-spam: too many messages").catch(() => {});
      await sendAutomodAlert(message, "🚫 Anti-Spam", "You are sending messages too fast! You've been muted for 30 seconds.");
      spamMap.set(key, { count: 0, lastMessage: now });
      return;
    }
  }
}

async function sendAutomodAlert(message: Message, title: string, reason: string) {
  try {
    const embed = new EmbedBuilder()
      .setColor(0xff4400)
      .setTitle(`🛡️ Automod: ${title}`)
      .setDescription(reason)
      .setFooter({ text: `User: ${message.author.tag}` })
      .setTimestamp();

    const dm = await message.author.createDM().catch(() => null);
    if (dm) await dm.send({ embeds: [embed] }).catch(() => {});
  } catch {}
}
