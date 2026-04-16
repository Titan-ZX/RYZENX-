import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  VoiceChannel,
  OverwriteType,
} from "discord.js";
import { pool } from "../../database";

async function getOwnerChannel(userId: string, guildId: string): Promise<VoiceChannel | null> {
  const result = await pool.query(
    "SELECT channel_id FROM voicemaster_channels WHERE owner_id = $1 AND guild_id = $2",
    [userId, guildId]
  );
  if (!result.rows.length) return null;
  return null;
}

export default {
  data: new SlashCommandBuilder()
    .setName("voicemaster")
    .setDescription("🎙️ Voice Master — control your personal voice channel")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("🔧 Set up the Voice Master system")
        .addChannelOption((opt) =>
          opt.setName("category").setDescription("Category to create VCs in").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("name")
        .setDescription("✏️ Rename your voice channel")
        .addStringOption((opt) => opt.setName("name").setDescription("New channel name").setRequired(true).setMaxLength(100))
    )
    .addSubcommand((sub) =>
      sub
        .setName("limit")
        .setDescription("👥 Set user limit (0 = unlimited)")
        .addIntegerOption((opt) => opt.setName("limit").setDescription("Max users (0-99)").setRequired(true).setMinValue(0).setMaxValue(99))
    )
    .addSubcommand((sub) => sub.setName("lock").setDescription("🔒 Lock your voice channel"))
    .addSubcommand((sub) => sub.setName("unlock").setDescription("🔓 Unlock your voice channel"))
    .addSubcommand((sub) => sub.setName("hide").setDescription("🙈 Hide your channel from others"))
    .addSubcommand((sub) => sub.setName("show").setDescription("👁️ Make your channel visible"))
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("👢 Kick a user from your channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to kick").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("ban")
        .setDescription("🚫 Ban a user from your channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to ban").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("permit")
        .setDescription("✅ Allow a user into your locked channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to permit").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("claim").setDescription("👑 Claim an empty voice channel"))
    .addSubcommand((sub) =>
      sub
        .setName("bitrate")
        .setDescription("📡 Set channel bitrate (kbps)")
        .addIntegerOption((opt) =>
          opt.setName("kbps").setDescription("Bitrate in kbps (8-384)").setRequired(true).setMinValue(8).setMaxValue(384)
        )
    )
    .addSubcommand((sub) => sub.setName("info").setDescription("ℹ️ View your channel info"))
    .addSubcommand((sub) =>
      sub
        .setName("transfer")
        .setDescription("🔄 Transfer ownership to another user")
        .addUserOption((opt) => opt.setName("user").setDescription("New owner").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === "setup") {
      const category = interaction.options.getChannel("category", true);

      const setupChannel = await guild.channels.create({
        name: "➕ Create VC",
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
        ],
      });

      await pool.query(
        "INSERT INTO voicemaster_settings (guild_id, setup_channel, category_id) VALUES ($1, $2, $3) ON CONFLICT (guild_id) DO UPDATE SET setup_channel = $2, category_id = $3",
        [guild.id, setupChannel.id, category.id]
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎙️ Voice Master Setup Complete!")
        .setDescription(`Users can now join **${setupChannel.name}** to get their own private voice channel!`)
        .addFields(
          { name: "📍 Setup Channel", value: `${setupChannel}`, inline: true },
          { name: "📁 Category", value: `${category}`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Voice Master System" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    const ownerRow = await pool.query(
      "SELECT channel_id FROM voicemaster_channels WHERE owner_id = $1 AND guild_id = $2",
      [interaction.user.id, guild.id]
    );

    if (sub === "claim") {
      const member = interaction.member as any;
      const voiceChannel = member?.voice?.channel as VoiceChannel;
      if (!voiceChannel) return interaction.reply({ content: "❌ You must be in a voice channel.", ephemeral: true });

      const existing = await pool.query(
        "SELECT owner_id FROM voicemaster_channels WHERE channel_id = $1",
        [voiceChannel.id]
      );
      if (!existing.rows.length) return interaction.reply({ content: "❌ This is not a Voice Master channel.", ephemeral: true });

      const ownerInChannel = voiceChannel.members.has(existing.rows[0].owner_id);
      if (ownerInChannel) return interaction.reply({ content: "❌ The owner is still in the channel.", ephemeral: true });

      await pool.query(
        "UPDATE voicemaster_channels SET owner_id = $1 WHERE channel_id = $2",
        [interaction.user.id, voiceChannel.id]
      );

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`👑 You are now the owner of **${voiceChannel.name}**!`)],
      });
    }

    if (!ownerRow.rows.length) {
      return interaction.reply({ content: "❌ You don't own a Voice Master channel. Join the setup channel to create one.", ephemeral: true });
    }

    const channelId = ownerRow.rows[0].channel_id;
    const channel = guild.channels.cache.get(channelId) as VoiceChannel;
    if (!channel) return interaction.reply({ content: "❌ Your channel no longer exists.", ephemeral: true });

    if (sub === "name") {
      const name = interaction.options.getString("name", true);
      await channel.setName(name);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✏️ Channel renamed to **${name}**`)], ephemeral: true });
    }

    if (sub === "limit") {
      const limit = interaction.options.getInteger("limit", true);
      await channel.setUserLimit(limit);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`👥 User limit set to **${limit === 0 ? "Unlimited" : limit}**`)], ephemeral: true });
    }

    if (sub === "lock") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("🔒 Your channel is now **locked**")], ephemeral: true });
    }

    if (sub === "unlock") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription("🔓 Your channel is now **unlocked**")], ephemeral: true });
    }

    if (sub === "hide") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription("🙈 Your channel is now **hidden**")], ephemeral: true });
    }

    if (sub === "show") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription("👁️ Your channel is now **visible**")], ephemeral: true });
    }

    if (sub === "kick") {
      const target = interaction.options.getMember("user") as any;
      if (!target?.voice?.channel || target.voice.channel.id !== channelId) {
        return interaction.reply({ content: "❌ That user is not in your channel.", ephemeral: true });
      }
      await target.voice.disconnect("Voice Master kick");
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`👢 Kicked **${target.user.tag}** from your channel.`)], ephemeral: true });
    }

    if (sub === "ban") {
      const target = interaction.options.getUser("user", true);
      await channel.permissionOverwrites.edit(target, { Connect: false, ViewChannel: false });
      const member = guild.members.cache.get(target.id);
      if (member?.voice?.channel?.id === channelId) await member.voice.disconnect();
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`🚫 **${target.tag}** has been banned from your channel.`)], ephemeral: true });
    }

    if (sub === "permit") {
      const target = interaction.options.getUser("user", true);
      await channel.permissionOverwrites.edit(target, { Connect: true, ViewChannel: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ **${target.tag}** can now join your channel.`)], ephemeral: true });
    }

    if (sub === "bitrate") {
      const kbps = interaction.options.getInteger("kbps", true);
      await channel.setBitrate(kbps * 1000);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`📡 Bitrate set to **${kbps}kbps**`)], ephemeral: true });
    }

    if (sub === "transfer") {
      const target = interaction.options.getUser("user", true);
      await pool.query(
        "UPDATE voicemaster_channels SET owner_id = $1 WHERE channel_id = $2",
        [target.id, channelId]
      );
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`🔄 Transferred ownership to **${target.tag}**`)], ephemeral: true });
    }

    if (sub === "info") {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎙️ Your Voice Channel")
        .addFields(
          { name: "📍 Channel", value: `${channel}`, inline: true },
          { name: "👥 Users", value: `${channel.members.size}/${channel.userLimit || "∞"}`, inline: true },
          { name: "📡 Bitrate", value: `${channel.bitrate / 1000}kbps`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Voice Master" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
