import { VoiceState, ChannelType, PermissionFlagsBits } from "discord.js";
import { pool } from "../database";

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const guild = newState.guild || oldState.guild;

  const settings = await pool.query(
    "SELECT * FROM voicemaster_settings WHERE guild_id = $1",
    [guild.id]
  );
  if (!settings.rows.length || !settings.rows[0].setup_channel) return;

  const config = settings.rows[0];

  if (newState.channelId === config.setup_channel && newState.member) {
    const member = newState.member;
    const channelName = config.default_name.replace("{username}", member.displayName);

    try {
      const newChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: config.category_id,
        userLimit: config.default_limit || 0,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.MuteMembers,
              PermissionFlagsBits.DeafenMembers,
              PermissionFlagsBits.ViewChannel,
            ],
          },
          { id: guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
        ],
      });

      await member.voice.setChannel(newChannel);

      await pool.query(
        "INSERT INTO voicemaster_channels (channel_id, guild_id, owner_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [newChannel.id, guild.id, member.id]
      );
    } catch (err) {
      console.error("[VoiceMaster] Failed to create channel:", err);
    }
  }

  if (oldState.channelId) {
    const vmChannel = await pool.query(
      "SELECT * FROM voicemaster_channels WHERE channel_id = $1",
      [oldState.channelId]
    );
    if (!vmChannel.rows.length) return;

    const channel = oldState.channel;
    if (channel && channel.members.size === 0) {
      try {
        await channel.delete();
        await pool.query("DELETE FROM voicemaster_channels WHERE channel_id = $1", [oldState.channelId]);
      } catch {}
    }
  }
}
