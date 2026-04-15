import { GuildMember, EmbedBuilder, TextChannel } from "discord.js";
import { getGuildSettings, pool } from "../database";

export async function onGuildMemberAdd(member: GuildMember) {
  const settings = await getGuildSettings(member.guild.id);

  if (settings.autorole) {
    try {
      const role = member.guild.roles.cache.get(settings.autorole);
      if (role) await member.roles.add(role);
    } catch (err) {
      console.error("[AutoRole] Failed to assign role:", err);
    }
  }

  if (settings.welcome_channel) {
    const channel = member.guild.channels.cache.get(settings.welcome_channel) as TextChannel;
    if (channel) {
      const msg = (settings.welcome_message || "Welcome to the server, {user}!")
        .replace("{user}", member.toString())
        .replace("{username}", member.user.username)
        .replace("{server}", member.guild.name)
        .replace("{count}", member.guild.memberCount.toString());

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("👋 Welcome!")
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL())
        .setFooter({ text: `Member #${member.guild.memberCount}` })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }
  }
}
