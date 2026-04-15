import { GuildMember, PartialGuildMember, EmbedBuilder, TextChannel } from "discord.js";
import { getGuildSettings } from "../database";

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  const settings = await getGuildSettings(member.guild.id);

  if (settings.goodbye_channel) {
    const channel = member.guild.channels.cache.get(settings.goodbye_channel) as TextChannel;
    if (channel) {
      const msg = (settings.goodbye_message || "Goodbye, {user}!")
        .replace("{user}", member.user?.username || "Unknown")
        .replace("{username}", member.user?.username || "Unknown")
        .replace("{server}", member.guild.name);

      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("👋 Goodbye!")
        .setDescription(msg)
        .setThumbnail(member.user?.displayAvatarURL() || null)
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }
  }
}
