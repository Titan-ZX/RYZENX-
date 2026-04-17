import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import {
  joinAndPlay,
  searchTracks,
  getQueue,
  destroyQueue,
  queues,
} from "../../handlers/musicPlayer";

function requireVC(interaction: ChatInputCommandInteraction): any {
  const member = interaction.member as GuildMember;
  const vc = member?.voice?.channel;
  if (!vc) {
    interaction.reply({ content: "❌ You must be in a voice channel to use music commands.", ephemeral: true });
    return null;
  }
  return vc;
}

function nowPlayingEmbed(guildId: string) {
  const q = getQueue(guildId);
  if (!q?.currentTrack) {
    return new EmbedBuilder().setColor(0xff6600).setDescription("❌ Nothing is playing right now.");
  }
  const t = q.currentTrack;
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: "🎵 Now Playing" })
    .setTitle(t.title.substring(0, 256))
    .setURL(t.url)
    .setThumbnail(t.thumbnail)
    .addFields(
      { name: "⏱️ Duration", value: t.duration, inline: true },
      { name: "🔊 Volume", value: `${q.volume}%`, inline: true },
      { name: "🔁 Loop", value: q.loop ? "On" : "Off", inline: true },
      { name: "📋 Queue", value: `${q.tracks.length} track${q.tracks.length !== 1 ? "s" : ""} up next`, inline: true },
      { name: "👤 Requested by", value: t.requestedBy, inline: true },
    )
    .setFooter({ text: "RYZENX™ Music Master" })
    .setTimestamp();
}

function playerButtons() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("music_skip").setLabel("⏭️ Skip").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("music_pause").setLabel("⏸️ Pause").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_resume").setLabel("▶️ Resume").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("music_stop").setLabel("⏹️ Stop").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("music_queue").setLabel("📋 Queue").setStyle(ButtonStyle.Secondary),
  );
}

export default {
  data: new SlashCommandBuilder()
    .setName("music")
    .setDescription("🎵 Music Master — play songs in your voice channel")
    .addSubcommand((sub) =>
      sub.setName("play").setDescription("▶️ Play a song or add to queue")
        .addStringOption((opt) => opt.setName("query").setDescription("Song name or YouTube URL").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("skip").setDescription("⏭️ Skip the current song"))
    .addSubcommand((sub) => sub.setName("stop").setDescription("⏹️ Stop music and clear the queue"))
    .addSubcommand((sub) => sub.setName("pause").setDescription("⏸️ Pause the current song"))
    .addSubcommand((sub) => sub.setName("resume").setDescription("▶️ Resume playback"))
    .addSubcommand((sub) => sub.setName("nowplaying").setDescription("🎵 Show what's currently playing"))
    .addSubcommand((sub) => sub.setName("queue").setDescription("📋 View the music queue")
      .addIntegerOption((opt) => opt.setName("page").setDescription("Page number").setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub.setName("volume").setDescription("🔊 Set the volume (1–100)")
        .addIntegerOption((opt) => opt.setName("level").setDescription("Volume level").setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) => sub.setName("loop").setDescription("🔁 Toggle loop mode for the current song"))
    .addSubcommand((sub) => sub.setName("shuffle").setDescription("🔀 Shuffle the queue"))
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("🗑️ Remove a song from the queue")
        .addIntegerOption((opt) => opt.setName("position").setDescription("Position in queue (1 = next)").setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) => sub.setName("clear").setDescription("🗑️ Clear the entire queue"))
    .addSubcommand((sub) => sub.setName("join").setDescription("🔗 Join your voice channel"))
    .addSubcommand((sub) => sub.setName("leave").setDescription("👋 Leave the voice channel")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    // ── JOIN ────────────────────────────────────────────────────────
    if (sub === "join") {
      const vc = requireVC(interaction);
      if (!vc) return;
      const { joinVoiceChannel } = await import("@discordjs/voice");
      joinVoiceChannel({ channelId: vc.id, guildId, adapterCreator: vc.guild.voiceAdapterCreator });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ Joined **${vc.name}**!`)], ephemeral: true });
    }

    // ── LEAVE ────────────────────────────────────────────────────────
    if (sub === "leave") {
      destroyQueue(guildId);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription("👋 Left the voice channel and cleared the queue.")], ephemeral: true });
    }

    // ── PLAY ─────────────────────────────────────────────────────────
    if (sub === "play") {
      const vc = requireVC(interaction);
      if (!vc) return;
      const query = interaction.options.getString("query", true);

      await interaction.deferReply();

      const track = await searchTracks(query, interaction.user.tag);
      if (!track) {
        return interaction.editReply({ content: "❌ No results found for that query." });
      }

      const queue = getQueue(guildId);
      const { TextChannel } = await import("discord.js");
      await joinAndPlay(guildId, vc, interaction.channel as any, track);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(queue?.currentTrack ? "📋 Added to Queue" : "🎵 Now Playing")
        .setDescription(`**[${track.title}](${track.url})**`)
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: "⏱️ Duration", value: track.duration, inline: true },
          { name: "👤 Requested by", value: track.requestedBy, inline: true },
        )
        .setFooter({ text: "RYZENX™ Music Master" })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], components: [playerButtons()] });
    }

    // ── COMMANDS THAT NEED AN ACTIVE QUEUE ───────────────────────────
    const queue = getQueue(guildId);
    if (!queue) {
      return interaction.reply({ content: "❌ No music is playing. Use `/music play` to start.", ephemeral: true });
    }

    if (sub === "skip") {
      if (!queue.currentTrack) return interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
      const title = queue.currentTrack.title;
      queue.player.stop();
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`⏭️ Skipped **${title.substring(0, 100)}**`)] });
    }

    if (sub === "pause") {
      queue.player.pause();
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xffaa00).setDescription("⏸️ Playback **paused**.")] });
    }

    if (sub === "resume") {
      queue.player.unpause();
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription("▶️ Playback **resumed**.")] });
    }

    if (sub === "stop") {
      destroyQueue(guildId);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("⏹️ Music stopped and queue cleared.")] });
    }

    if (sub === "nowplaying") {
      return interaction.reply({ embeds: [nowPlayingEmbed(guildId)], components: [playerButtons()] });
    }

    if (sub === "queue") {
      const page = (interaction.options.getInteger("page") ?? 1) - 1;
      const perPage = 10;
      const all = queue.currentTrack ? [queue.currentTrack, ...queue.tracks] : queue.tracks;

      if (!all.length) {
        return interaction.reply({ content: "📭 The queue is empty.", ephemeral: true });
      }

      const totalPages = Math.ceil(all.length / perPage) || 1;
      const slice = all.slice(page * perPage, (page + 1) * perPage);
      const lines = slice.map((t, i) => {
        const pos = page * perPage + i;
        const label = pos === 0 && queue.currentTrack ? "▶️ Now Playing" : `${pos}.`;
        return `${label} **[${t.title.substring(0, 60)}](${t.url})** \`${t.duration}\` — ${t.requestedBy}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎵 Music Queue — ${all.length} track${all.length !== 1 ? "s" : ""}`)
        .setDescription(lines.join("\n"))
        .addFields(
          { name: "🔁 Loop", value: queue.loop ? "On" : "Off", inline: true },
          { name: "🔊 Volume", value: `${queue.volume}%`, inline: true },
        )
        .setFooter({ text: `RYZENX™ Music Master • Page ${page + 1}/${totalPages}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "volume") {
      const level = interaction.options.getInteger("level", true);
      queue.volume = level;
      (queue.player as any).state?.resource?.volume?.setVolume(level / 100);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`🔊 Volume set to **${level}%**`)] });
    }

    if (sub === "loop") {
      queue.loop = !queue.loop;
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2)
          .setDescription(`🔁 Loop mode is now **${queue.loop ? "ON" : "OFF"}**`)],
      });
    }

    if (sub === "shuffle") {
      for (let i = queue.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
      }
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`🔀 Queue shuffled! **${queue.tracks.length}** tracks.`)] });
    }

    if (sub === "remove") {
      const pos = interaction.options.getInteger("position", true) - 1;
      if (pos < 0 || pos >= queue.tracks.length) {
        return interaction.reply({ content: `❌ Invalid position. Queue has **${queue.tracks.length}** track(s).`, ephemeral: true });
      }
      const removed = queue.tracks.splice(pos, 1)[0];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`🗑️ Removed **${removed.title.substring(0, 100)}**`)] });
    }

    if (sub === "clear") {
      queue.tracks = [];
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription("🗑️ Queue cleared!")] });
    }
  },
};
