import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  VoiceChannel,
} from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("voicemaster")
    .setDescription("🎙️ Voice Master — manage your private voice channel")
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("🔧 Set up Voice Master in your server")
        .addChannelOption((opt) => opt.setName("category").setDescription("Category to place VCs in").setRequired(true))
        .addStringOption((opt) => opt.setName("name_template").setDescription("Channel name template — use {username} (default: {username}'s Channel)"))
        .addIntegerOption((opt) => opt.setName("default_limit").setDescription("Default user limit (0 = unlimited)").setMinValue(0).setMaxValue(99))
    )
    .addSubcommand((sub) =>
      sub.setName("name").setDescription("✏️ Rename your channel")
        .addStringOption((opt) => opt.setName("name").setDescription("New name").setRequired(true).setMaxLength(100))
    )
    .addSubcommand((sub) =>
      sub.setName("limit").setDescription("👥 Set user limit")
        .addIntegerOption((opt) => opt.setName("limit").setDescription("Max users (0 = unlimited)").setRequired(true).setMinValue(0).setMaxValue(99))
    )
    .addSubcommand((sub) => sub.setName("lock").setDescription("🔒 Lock — only permitted users can join"))
    .addSubcommand((sub) => sub.setName("unlock").setDescription("🔓 Unlock — anyone can join"))
    .addSubcommand((sub) => sub.setName("hide").setDescription("🙈 Hide — channel invisible to others"))
    .addSubcommand((sub) => sub.setName("show").setDescription("👁️ Show — make channel visible"))
    .addSubcommand((sub) =>
      sub.setName("permit").setDescription("✅ Allow a specific user to join")
        .addUserOption((opt) => opt.setName("user").setDescription("User to permit").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("kick").setDescription("👢 Kick a user from your channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to kick").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("ban").setDescription("🚫 Ban a user from your channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to ban").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("unban").setDescription("✅ Unban a user from your channel")
        .addUserOption((opt) => opt.setName("user").setDescription("User to unban").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("transfer").setDescription("🔄 Transfer ownership to another user")
        .addUserOption((opt) => opt.setName("user").setDescription("New owner").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("claim").setDescription("👑 Claim an abandoned voice channel"))
    .addSubcommand((sub) =>
      sub.setName("bitrate").setDescription("📡 Set channel bitrate")
        .addIntegerOption((opt) => opt.setName("kbps").setDescription("Bitrate kbps (8–384)").setRequired(true).setMinValue(8).setMaxValue(384))
    )
    .addSubcommand((sub) =>
      sub.setName("region").setDescription("🌍 Set voice region")
        .addStringOption((opt) =>
          opt.setName("region").setDescription("Region (or 'auto')").setRequired(true)
            .addChoices(
              { name: "🌐 Automatic", value: "auto" },
              { name: "🇺🇸 US East", value: "us-east" },
              { name: "🇺🇸 US West", value: "us-west" },
              { name: "🇺🇸 US Central", value: "us-central" },
              { name: "🇺🇸 US South", value: "us-south" },
              { name: "🇬🇧 Europe", value: "europe" },
              { name: "🇸🇬 Singapore", value: "singapore" },
              { name: "🇮🇳 India", value: "india" },
              { name: "🇧🇷 Brazil", value: "brazil" },
              { name: "🇦🇺 Sydney", value: "sydney" },
              { name: "🇯🇵 Japan", value: "japan" },
              { name: "🇿🇦 South Africa", value: "southafrica" },
              { name: "🇭🇰 Hong Kong", value: "hongkong" },
            )
        )
    )
    .addSubcommand((sub) => sub.setName("ghost").setDescription("👻 Toggle ghost mode — channel hidden, permitted users can still join"))
    .addSubcommand((sub) => sub.setName("info").setDescription("ℹ️ View your channel info"))
    .addSubcommand((sub) => sub.setName("reset").setDescription("🔄 Reset channel to default settings")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    // ── SETUP ──────────────────────────────────────────────────────
    if (sub === "setup") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "❌ You need **Administrator** permission.", ephemeral: true });
      }
      const category = interaction.options.getChannel("category", true);
      const nameTemplate = interaction.options.getString("name_template") || "{username}'s Channel";
      const defaultLimit = interaction.options.getInteger("default_limit") ?? 0;

      const setupChannel = await guild.channels.create({
        name: "➕  Create VC",
        type: ChannelType.GuildVoice,
        parent: category.id,
        permissionOverwrites: [{ id: guild.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] }],
      });

      await pool.query(
        `INSERT INTO voicemaster_settings (guild_id, setup_channel, category_id, default_name, default_limit)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (guild_id) DO UPDATE SET setup_channel = $2, category_id = $3, default_name = $4, default_limit = $5`,
        [guild.id, setupChannel.id, category.id, nameTemplate, defaultLimit]
      );

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("🎙️ Voice Master Active!")
          .setDescription(`Join **${setupChannel.name}** to auto-create a private VC!`)
          .addFields(
            { name: "📍 Join Channel", value: `${setupChannel}`, inline: true },
            { name: "📁 Category", value: `${category}`, inline: true },
            { name: "📝 Name Template", value: `\`${nameTemplate}\``, inline: true },
            { name: "👥 Default Limit", value: defaultLimit === 0 ? "Unlimited" : `${defaultLimit}`, inline: true },
          )
          .setFooter({ text: "RYZENX™ Voice Master System" })
          .setTimestamp()],
      });
    }

    // ── CLAIM ──────────────────────────────────────────────────────
    if (sub === "claim") {
      const member = interaction.member as any;
      const voiceChannel = member?.voice?.channel as VoiceChannel;
      if (!voiceChannel) return interaction.reply({ content: "❌ You must be in a voice channel.", ephemeral: true });

      const existing = await pool.query("SELECT owner_id FROM voicemaster_channels WHERE channel_id = $1", [voiceChannel.id]);
      if (!existing.rows.length) return interaction.reply({ content: "❌ This is not a Voice Master channel.", ephemeral: true });

      const ownerInChannel = voiceChannel.members.has(existing.rows[0].owner_id);
      if (ownerInChannel) return interaction.reply({ content: "❌ The owner is still in the channel!", ephemeral: true });

      await pool.query("UPDATE voicemaster_channels SET owner_id = $1 WHERE channel_id = $2", [interaction.user.id, voiceChannel.id]);
      await voiceChannel.permissionOverwrites.edit(interaction.user.id, {
        ManageChannels: true, Connect: true, Speak: true, MoveMembers: true, ViewChannel: true,
      }).catch(() => {});

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xffd700).setDescription(`👑 You are now the owner of **${voiceChannel.name}**!`)],
      });
    }

    // ── GET OWNER CHANNEL ──────────────────────────────────────────
    const ownerRow = await pool.query(
      "SELECT channel_id FROM voicemaster_channels WHERE owner_id = $1 AND guild_id = $2",
      [interaction.user.id, guild.id]
    );

    if (!ownerRow.rows.length) {
      return interaction.reply({
        content: "❌ You don't own a Voice Master channel. Join the **➕ Create VC** channel to create one.",
        ephemeral: true,
      });
    }

    const channelId = ownerRow.rows[0].channel_id;
    const channel = guild.channels.cache.get(channelId) as VoiceChannel;
    if (!channel) {
      await pool.query("DELETE FROM voicemaster_channels WHERE channel_id = $1", [channelId]);
      return interaction.reply({ content: "❌ Your channel no longer exists.", ephemeral: true });
    }

    // ── CHANNEL CONTROLS ───────────────────────────────────────────
    if (sub === "name") {
      const name = interaction.options.getString("name", true);
      await channel.setName(name);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✏️ Channel renamed to **${name}**`)],
        ephemeral: true,
      });
    }

    if (sub === "limit") {
      const limit = interaction.options.getInteger("limit", true);
      await channel.setUserLimit(limit);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`👥 Limit set to **${limit === 0 ? "Unlimited" : limit}**`)],
        ephemeral: true,
      });
    }

    if (sub === "lock") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("🔒 Channel **locked** — only permitted users can join.")], ephemeral: true });
    }

    if (sub === "unlock") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription("🔓 Channel **unlocked**.")], ephemeral: true });
    }

    if (sub === "hide") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription("🙈 Channel is now **hidden**.")], ephemeral: true });
    }

    if (sub === "show") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription("👁️ Channel is now **visible**.")], ephemeral: true });
    }

    if (sub === "ghost") {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false, Connect: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x9b59b6).setDescription("👻 **Ghost mode** enabled — use `/voicemaster permit` to let specific users join.")], ephemeral: true });
    }

    if (sub === "permit") {
      const target = interaction.options.getUser("user", true);
      await channel.permissionOverwrites.edit(target, { Connect: true, ViewChannel: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ **${target.tag}** can now join your channel.`)], ephemeral: true });
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
      if (member?.voice?.channel?.id === channelId) await member.voice.disconnect().catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`🚫 **${target.tag}** is banned from your channel.`)], ephemeral: true });
    }

    if (sub === "unban") {
      const target = interaction.options.getUser("user", true);
      await channel.permissionOverwrites.delete(target).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ **${target.tag}** has been unbanned from your channel.`)], ephemeral: true });
    }

    if (sub === "transfer") {
      const target = interaction.options.getUser("user", true);
      await pool.query("UPDATE voicemaster_channels SET owner_id = $1 WHERE channel_id = $2", [target.id, channelId]);
      await channel.permissionOverwrites.edit(target, { ManageChannels: true, Connect: true, Speak: true, MoveMembers: true, ViewChannel: true }).catch(() => {});
      await channel.permissionOverwrites.edit(interaction.user.id, { ManageChannels: null }).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setDescription(`🔄 Ownership transferred to **${target.tag}**!`)], ephemeral: true });
    }

    if (sub === "bitrate") {
      const kbps = interaction.options.getInteger("kbps", true);
      await channel.setBitrate(kbps * 1000);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`📡 Bitrate set to **${kbps}kbps**`)], ephemeral: true });
    }

    if (sub === "region") {
      const region = interaction.options.getString("region", true);
      await channel.setRTCRegion(region === "auto" ? null : region);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`🌍 Region set to **${region === "auto" ? "Automatic" : region}**`)], ephemeral: true });
    }

    if (sub === "reset") {
      await channel.setName(`${interaction.user.displayName}'s Channel`);
      await channel.setUserLimit(0);
      await channel.permissionOverwrites.edit(guild.roles.everyone, { Connect: true, ViewChannel: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription("🔄 Channel reset to default settings.")], ephemeral: true });
    }

    if (sub === "info") {
      const memberList = channel.members.map((m) => `• ${m.user.tag}`).join("\n") || "No members";
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎙️ Your Voice Channel")
        .addFields(
          { name: "📍 Channel", value: `${channel}`, inline: true },
          { name: "👥 Members", value: `${channel.members.size}/${channel.userLimit || "∞"}`, inline: true },
          { name: "📡 Bitrate", value: `${channel.bitrate / 1000}kbps`, inline: true },
          { name: "🌍 Region", value: channel.rtcRegion || "Automatic", inline: true },
          { name: "🔒 Locked?", value: channel.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.Connect) ? "No" : "Yes", inline: true },
          { name: "👁️ Visible?", value: channel.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel) ? "Yes" : "No", inline: true },
          { name: "👤 Members in VC", value: memberList.substring(0, 200), inline: false },
        )
        .setFooter({ text: "RYZENX™ Voice Master" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
