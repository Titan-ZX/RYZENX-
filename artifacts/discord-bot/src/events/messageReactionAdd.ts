import { MessageReaction, User, TextChannel, EmbedBuilder } from "discord.js";
import { pool, getGuildSettings } from "../database";

export async function onMessageReactionAdd(reaction: MessageReaction, user: User) {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch { return; }
  }
  if (!reaction.message.guild) return;

  const emoji = reaction.emoji.id
    ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
    : reaction.emoji.name!;

  const rrResult = await pool.query(
    "SELECT role_id FROM reaction_roles WHERE message_id = $1 AND emoji = $2",
    [reaction.message.id, emoji]
  );
  if (rrResult.rows.length > 0) {
    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (member) {
      const role = reaction.message.guild.roles.cache.get(rrResult.rows[0].role_id);
      if (role) await member.roles.add(role).catch(console.error);
    }
  }

  if (reaction.emoji.name === "⭐") {
    const settings = await getGuildSettings(reaction.message.guild.id);
    if (!settings.starboard_channel) return;

    const count = reaction.count || 1;
    if (count < settings.starboard_threshold) return;

    const existing = await pool.query(
      "SELECT * FROM starboard WHERE original_message_id = $1",
      [reaction.message.id]
    );

    const starChannel = reaction.message.guild.channels.cache.get(settings.starboard_channel) as TextChannel;
    if (!starChannel) return;

    const msg = reaction.message;
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({ name: msg.author?.username || "Unknown", iconURL: msg.author?.displayAvatarURL() })
      .setDescription(msg.content || "*No text content*")
      .addFields({ name: "Source", value: `[Jump to message](${msg.url})` })
      .setTimestamp(msg.createdAt);

    if (msg.attachments.first()) embed.setImage(msg.attachments.first()!.url);

    if (existing.rows.length === 0) {
      const starMsg = await starChannel.send({ content: `⭐ **${count}** | ${msg.channel}`, embeds: [embed] });
      await pool.query(
        "INSERT INTO starboard (original_message_id, starboard_message_id, guild_id, star_count) VALUES ($1, $2, $3, $4)",
        [reaction.message.id, starMsg.id, reaction.message.guild.id, count]
      );
    } else {
      await pool.query(
        "UPDATE starboard SET star_count = $1 WHERE original_message_id = $2",
        [count, reaction.message.id]
      );
      try {
        const starMsg = await starChannel.messages.fetch(existing.rows[0].starboard_message_id);
        await starMsg.edit({ content: `⭐ **${count}** | ${msg.channel}`, embeds: [embed] });
      } catch {}
    }
  }
}
