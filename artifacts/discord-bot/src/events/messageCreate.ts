import { Message, EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../types";
import { handleAutomod } from "../handlers/automod";
import { handleLeveling } from "../handlers/leveling";
import { getGuildSettings, pool } from "../database";
import { buildHelpEmbed, buildHelpRow } from "../commands/utility/help";

const spamMap = new Map<string, { count: number; lastMessage: number }>();

export async function onMessageCreate(client: ExtendedClient, message: Message) {
  if (message.author.bot || !message.guild) return;

  // ─── AFK: clear status if user sends a message ───────────────
  const afkResult = await pool.query(
    "SELECT reason, since FROM afk_users WHERE user_id = $1 AND guild_id = $2",
    [message.author.id, message.guild.id]
  ).catch(() => null);

  if (afkResult?.rows.length) {
    await pool.query("DELETE FROM afk_users WHERE user_id = $1 AND guild_id = $2", [message.author.id, message.guild.id]).catch(() => {});
    const since = new Date(afkResult.rows[0].since);
    const elapsed = Math.floor((Date.now() - since.getTime()) / 60000);
    const elapsed_str = elapsed < 60 ? `${elapsed} minutes` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
    await message.reply({
      embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`👋 Welcome back, **${message.author.username}**! You were AFK for **${elapsed_str}**.`)],
      allowedMentions: { repliedUser: false },
    }).catch(() => {});
  }

  // ─── AFK: notify if someone mentions an AFK user ─────────────
  if (message.mentions.users.size) {
    for (const [, mentioned] of message.mentions.users) {
      if (mentioned.bot) continue;
      const afkUser = await pool.query(
        "SELECT reason, since FROM afk_users WHERE user_id = $1 AND guild_id = $2",
        [mentioned.id, message.guild.id]
      ).catch(() => null);

      if (afkUser?.rows.length) {
        const since = new Date(afkUser.rows[0].since);
        const elapsed = Math.floor((Date.now() - since.getTime()) / 60000);
        await message.reply({
          embeds: [new EmbedBuilder()
            .setColor(0x888888)
            .setDescription(`💤 **${mentioned.username}** is AFK: *${afkUser.rows[0].reason}*\n⏰ Since ${elapsed < 60 ? `${elapsed}m ago` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`}`)],
          allowedMentions: { repliedUser: false },
        }).catch(() => {});
      }
    }
  }

  // ─── Mention = help menu ──────────────────────────────────────
  const isMentioned = message.mentions.has(client.user!) && message.content.trim().match(/^<@!?(\d+)>(\s+.*)?$/);
  if (isMentioned && message.content.trim().match(/^<@!?(\d+)>$/)) {
    const embed = buildHelpEmbed(client);
    const row = buildHelpRow();
    await message.reply({ embeds: [embed], components: [row] });
    return;
  }

  // ─── Automod & Leveling ───────────────────────────────────────
  await handleAutomod(message, spamMap);
  await handleLeveling(message);

  // ─── Prefix commands ──────────────────────────────────────────
  const settings = await getGuildSettings(message.guild.id);
  const prefix = settings.prefix || "!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift()?.toLowerCase();

  if (cmdName === "help") {
    const embed = buildHelpEmbed(client);
    const row = buildHelpRow();
    await message.reply({ embeds: [embed], components: [row] });
  }
}
