import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { pool } from "../database";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: fetch all 🎉 reactors from giveaway message (excluding bots)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchReactionEntries(
  client: Client,
  giveaway: any
): Promise<string[]> {
  try {
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (!guild) return [];
    const channel = guild.channels.cache.get(giveaway.channel_id) as TextChannel;
    if (!channel) return [];
    const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);
    if (!message) return [];

    const reaction = message.reactions.cache.get("🎉") || await message.reactions.resolve("🎉");
    if (!reaction) return [];

    const users = await reaction.users.fetch();
    return users.filter((u) => !u.bot).map((u) => u.id);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pick random winners from a pool (no repeats)
// ─────────────────────────────────────────────────────────────────────────────
export function pickWinners(pool: string[], count: number): string[] {
  const copy = [...pool];
  const winners: string[] = [];
  for (let i = 0; i < Math.min(count, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length);
    winners.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return winners;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the "Ended" embed — styled like the reference screenshot
// ─────────────────────────────────────────────────────────────────────────────
export function buildEndedEmbed(giveaway: any, winners: string[], entryCount: number): EmbedBuilder {
  const winnerText = winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No valid entries";
  const endedTs = Math.floor(Date.now() / 1000);

  return new EmbedBuilder()
    .setColor(0xffd700)
    .setTitle("🎉 Giveaway Ended 🎉")
    .setDescription(
      `## 🎁 ${giveaway.prize}\n\n` +
      `🟡 **Hosted by:** <@${giveaway.host_id}>\n` +
      `🟡 **Valid participant(s):** ${entryCount}\n\n` +
      `🟡 **Winner${winners.length > 1 ? "s" : ""}:**\n${winnerText}`
    )
    .setFooter({ text: `Ended • RYZENX™ Giveaway System` })
    .setTimestamp();
}

// ─────────────────────────────────────────────────────────────────────────────
// End a giveaway: fetch reactions → pick winners → edit message → announce
// ─────────────────────────────────────────────────────────────────────────────
export async function endGiveaway(client: Client, gwId: number, triggeredBy?: string) {
  const result = await pool.query(
    "SELECT * FROM giveaways WHERE id = $1 AND ended = false",
    [gwId]
  );
  if (!result.rows.length) return null;
  const giveaway = result.rows[0];

  const entries = await fetchReactionEntries(client, giveaway);
  const winners = pickWinners(entries, giveaway.winners);

  // Mark as ended in DB
  await pool.query(
    "UPDATE giveaways SET ended = true, winner_ids = $1 WHERE id = $2",
    [winners, gwId]
  );

  // Edit original message to "ended" style
  try {
    const guild = client.guilds.cache.get(giveaway.guild_id);
    if (guild) {
      const channel = guild.channels.cache.get(giveaway.channel_id) as TextChannel;
      if (channel && giveaway.message_id) {
        const msg = await channel.messages.fetch(giveaway.message_id).catch(() => null);
        if (msg) {
          const endedEmbed = buildEndedEmbed(giveaway, winners, entries.length);
          await msg.edit({ embeds: [endedEmbed], components: [] }).catch(() => {});
        }

        // Announce winners
        const winnerText = winners.length ? winners.map((id) => `<@${id}>`).join(", ") : null;
        const announceEmbed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle("🎊 We have a winner!")
          .setDescription(
            winnerText
              ? `Congratulations ${winnerText}!\nYou won **${giveaway.prize}**! 🎁`
              : `No valid entries for **${giveaway.prize}**. Better luck next time!`
          )
          .addFields(
            { name: "🎁 Prize", value: giveaway.prize, inline: true },
            { name: "👥 Participants", value: `${entries.length}`, inline: true },
            { name: "🆔 Giveaway", value: `#${gwId}`, inline: true },
          )
          .setFooter({ text: triggeredBy ? `Ended by ${triggeredBy} • RYZENX™` : "RYZENX™ Giveaway System" })
          .setTimestamp();

        await channel.send({
          content: winnerText ? `🎉 Congratulations ${winnerText}!` : "",
          embeds: [announceEmbed],
        }).catch(() => {});
      }
    }
  } catch {}

  return { giveaway, winners, entries };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cron: auto-end expired giveaways every 30 seconds
// ─────────────────────────────────────────────────────────────────────────────
export function startGiveawayCron(client: Client) {
  setInterval(async () => {
    try {
      const expired = await pool.query(
        "SELECT * FROM giveaways WHERE ended = false AND ends_at <= NOW()"
      );
      for (const giveaway of expired.rows) {
        await endGiveaway(client, giveaway.id, undefined);
      }
    } catch {}
  }, 30_000);

  console.log("[Giveaway] Auto-end cron started (30s interval)");
}
