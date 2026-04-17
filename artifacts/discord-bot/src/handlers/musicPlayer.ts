import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  StreamType,
} from "@discordjs/voice";
import { TextChannel, VoiceBasedChannel, EmbedBuilder } from "discord.js";
import play from "play-dl";

export interface Track {
  title: string;
  url: string;
  duration: string;
  thumbnail: string | null;
  requestedBy: string;
}

export interface GuildQueue {
  tracks: Track[];
  player: AudioPlayer;
  currentTrack: Track | null;
  volume: number;
  loop: boolean;
  textChannel: TextChannel;
  voiceChannelId: string;
}

export const queues = new Map<string, GuildQueue>();

async function getTrackInfo(query: string): Promise<Track | null> {
  try {
    let info;
    if (play.yt_validate(query) === "video") {
      info = await play.video_info(query);
    } else {
      const results = await play.search(query, { limit: 1 });
      if (!results.length) return null;
      info = await play.video_info(results[0].url!);
    }

    const vid = info.video_details;
    const seconds = vid.durationInSec;
    const duration = seconds < 3600
      ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
      : `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

    return {
      title: vid.title ?? "Unknown Title",
      url: vid.url,
      duration,
      thumbnail: vid.thumbnails?.[0]?.url ?? null,
      requestedBy: "",
    };
  } catch (err) {
    console.error("[Music] Track info error:", err);
    return null;
  }
}

export async function createStream(url: string): Promise<AudioResource | null> {
  try {
    const stream = await play.stream(url);
    return createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });
  } catch {
    return null;
  }
}

async function playNext(guildId: string): Promise<void> {
  const queue = queues.get(guildId);
  if (!queue) return;

  if (queue.loop && queue.currentTrack) {
    queue.tracks.unshift(queue.currentTrack);
  }

  if (!queue.tracks.length) {
    queue.currentTrack = null;
    queue.textChannel.send({
      embeds: [new EmbedBuilder()
        .setColor(0x5865f2)
        .setDescription("✅ Queue finished! Use `/music play` to add more songs.")
        .setFooter({ text: "RYZENX™ Music" })],
    }).catch(() => {});
    return;
  }

  const track = queue.tracks.shift()!;
  queue.currentTrack = track;

  const resource = await createStream(track.url);
  if (!resource) {
    queue.textChannel.send({ content: `❌ Failed to stream **${track.title}**. Skipping...` }).catch(() => {});
    return playNext(guildId);
  }

  resource.volume?.setVolume(queue.volume / 100);
  queue.player.play(resource);

  queue.textChannel.send({
    embeds: [new EmbedBuilder()
      .setColor(0x00ff88)
      .setAuthor({ name: "🎵 Now Playing" })
      .setTitle(track.title.substring(0, 256))
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .addFields(
        { name: "⏱️ Duration", value: track.duration, inline: true },
        { name: "👤 Requested by", value: track.requestedBy, inline: true },
        { name: "🎶 Queue", value: `${queue.tracks.length} track${queue.tracks.length !== 1 ? "s" : ""} remaining`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Music Master" })
      .setTimestamp()],
  }).catch(() => {});
}

export async function joinAndPlay(
  guildId: string,
  voiceChannel: VoiceBasedChannel,
  textChannel: TextChannel,
  track: Track
): Promise<void> {
  let queue = queues.get(guildId);

  if (!queue) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    connection.subscribe(player);

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5000),
        ]);
      } catch {
        queues.delete(guildId);
        connection.destroy();
      }
    });

    queue = {
      tracks: [],
      player,
      currentTrack: null,
      volume: 80,
      loop: false,
      textChannel,
      voiceChannelId: voiceChannel.id,
    };

    queues.set(guildId, queue);

    player.on(AudioPlayerStatus.Idle, () => playNext(guildId));
    player.on("error", (err) => {
      console.error("[Music] Player error:", err);
      playNext(guildId);
    });
  }

  if (queue.currentTrack) {
    queue.tracks.push(track);
  } else {
    queue.tracks.push(track);
    await playNext(guildId);
  }
}

export async function searchTracks(query: string, requester: string): Promise<Track | null> {
  const track = await getTrackInfo(query);
  if (track) track.requestedBy = requester;
  return track;
}

export function getQueue(guildId: string): GuildQueue | undefined {
  return queues.get(guildId);
}

export function destroyQueue(guildId: string): void {
  const queue = queues.get(guildId);
  if (queue) {
    queue.player.stop(true);
    const connection = getVoiceConnection(guildId);
    connection?.destroy();
    queues.delete(guildId);
  }
}
