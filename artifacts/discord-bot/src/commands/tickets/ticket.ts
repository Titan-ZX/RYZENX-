import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { pool } from "../../database";

const PRIORITY_COLORS: Record<string, number> = {
  low: 0x00ff88, medium: 0x5865f2, high: 0xff8800, urgent: 0xff0000,
};
const PRIORITY_EMOJIS: Record<string, string> = {
  low: "🟢", medium: "🔵", high: "🟠", urgent: "🔴",
};

export async function createTicketChannel(
  guild: any,
  userId: string,
  topic: string | null,
  config: any,
  priority = "medium"
): Promise<TextChannel> {
  await pool.query(
    "UPDATE ticket_settings SET ticket_count = COALESCE(ticket_count, 0) + 1 WHERE guild_id = $1",
    [guild.id]
  );
  const countRes = await pool.query("SELECT ticket_count FROM ticket_settings WHERE guild_id = $1", [guild.id]);
  const count = countRes.rows[0]?.ticket_count || 1;

  const pEmoji = PRIORITY_EMOJIS[priority] || "🔵";
  const channelName = `${pEmoji}-ticket-${count.toString().padStart(4, "0")}`;
  const overwrites: any[] = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  if (config.support_role) {
    overwrites.push({
      id: config.support_role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  const channel = (await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.category_id || null,
    permissionOverwrites: overwrites,
  })) as TextChannel;

  await pool.query(
    "INSERT INTO tickets (guild_id, channel_id, user_id, topic, priority, number) VALUES ($1, $2, $3, $4, $5, $6)",
    [guild.id, channel.id, userId, topic || "No topic specified", priority, count]
  );

  const color = PRIORITY_COLORS[priority] || 0x5865f2;
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🎫 Ticket #${count.toString().padStart(4, "0")}`)
    .setDescription(
      `Hello <@${userId}>! Our support team will assist you shortly.\n\n` +
      `📋 **Topic:** ${topic || "No topic specified"}`
    )
    .addFields(
      { name: `${pEmoji} Priority`, value: `**${priority.charAt(0).toUpperCase() + priority.slice(1)}**`, inline: true },
      { name: "🆔 Ticket #", value: `#${count.toString().padStart(4, "0")}`, inline: true },
      { name: "📅 Created", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
      { name: "📋 How to close", value: "Use `/ticket close` or the button below.", inline: false },
    )
    .setFooter({ text: "RYZENX™ Ticket System" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Close").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket_claim_btn").setLabel("📌 Claim").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket_reopen_btn").setLabel("🔓 Reopen").setStyle(ButtonStyle.Success),
  );

  const mention = `<@${userId}>${config.support_role ? ` <@&${config.support_role}>` : ""}`;
  await channel.send({ content: mention, embeds: [embed], components: [row] });

  // Log to log channel
  if (config.log_channel) {
    const logCh = guild.channels.cache.get(config.log_channel) as TextChannel;
    if (logCh) {
      await logCh.send({
        embeds: [new EmbedBuilder()
          .setColor(color)
          .setTitle("🎫 New Ticket Created")
          .addFields(
            { name: "👤 User", value: `<@${userId}>`, inline: true },
            { name: "📍 Channel", value: `${channel}`, inline: true },
            { name: `${pEmoji} Priority`, value: priority, inline: true },
            { name: "📋 Topic", value: topic || "None", inline: false },
          )
          .setFooter({ text: "RYZENX™ Ticket System" })
          .setTimestamp()],
      }).catch(() => {});
    }
  }

  return channel;
}

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("🎫 Advanced ticket system management")
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("⚙️ Configure the ticket system")
        .addChannelOption((opt) => opt.setName("category").setDescription("Category for tickets").setRequired(true))
        .addRoleOption((opt) => opt.setName("support_role").setDescription("Support staff role"))
        .addChannelOption((opt) => opt.setName("log_channel").setDescription("Log channel"))
        .addIntegerOption((opt) => opt.setName("max_tickets").setDescription("Max open tickets per user (default: 1)").setMinValue(1).setMaxValue(10))
    )
    .addSubcommand((sub) =>
      sub.setName("panel").setDescription("📌 Send ticket panel to a channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel for panel").setRequired(true))
        .addStringOption((opt) => opt.setName("title").setDescription("Panel title"))
        .addStringOption((opt) => opt.setName("description").setDescription("Panel description"))
    )
    .addSubcommand((sub) =>
      sub.setName("create").setDescription("🎫 Open a ticket")
        .addStringOption((opt) => opt.setName("topic").setDescription("Reason / topic"))
        .addStringOption((opt) =>
          opt.setName("priority").setDescription("Priority level")
            .addChoices(
              { name: "🟢 Low", value: "low" },
              { name: "🔵 Medium", value: "medium" },
              { name: "🟠 High", value: "high" },
              { name: "🔴 Urgent", value: "urgent" },
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("close").setDescription("🔒 Close ticket")
        .addStringOption((opt) => opt.setName("reason").setDescription("Closing reason"))
    )
    .addSubcommand((sub) => sub.setName("reopen").setDescription("🔓 Reopen a closed ticket"))
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("➕ Add a user to this ticket")
        .addUserOption((opt) => opt.setName("user").setDescription("User to add").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("➖ Remove a user from this ticket")
        .addUserOption((opt) => opt.setName("user").setDescription("User to remove").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("rename").setDescription("✏️ Rename this ticket")
        .addStringOption((opt) => opt.setName("name").setDescription("New channel name").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("claim").setDescription("📌 Claim this ticket"))
    .addSubcommand((sub) => sub.setName("unclaim").setDescription("📌 Unclaim this ticket"))
    .addSubcommand((sub) =>
      sub.setName("priority").setDescription("🎯 Change ticket priority")
        .addStringOption((opt) =>
          opt.setName("level").setDescription("Priority level").setRequired(true)
            .addChoices(
              { name: "🟢 Low", value: "low" },
              { name: "🔵 Medium", value: "medium" },
              { name: "🟠 High", value: "high" },
              { name: "🔴 Urgent", value: "urgent" },
            )
        )
    )
    .addSubcommand((sub) => sub.setName("transcript").setDescription("📄 Save transcript of this ticket"))
    .addSubcommand((sub) => sub.setName("delete").setDescription("🗑️ Permanently delete this ticket"))
    .addSubcommand((sub) => sub.setName("list").setDescription("📋 List open tickets"))
    .addSubcommand((sub) => sub.setName("info").setDescription("ℹ️ View ticket info")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    // ── SETUP ─────────────────────────────────────────────────────
    if (sub === "setup") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
      }
      const category = interaction.options.getChannel("category", true);
      const supportRole = interaction.options.getRole("support_role");
      const logChannel = interaction.options.getChannel("log_channel");
      const maxTickets = interaction.options.getInteger("max_tickets") ?? 1;

      await pool.query(
        `INSERT INTO ticket_settings (guild_id, category_id, support_role, log_channel, max_tickets)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (guild_id) DO UPDATE
         SET category_id = $2, support_role = $3, log_channel = $4, max_tickets = $5`,
        [guild.id, category.id, supportRole?.id ?? null, logChannel?.id ?? null, maxTickets]
      );

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff88).setTitle("✅ Ticket System Configured!")
          .addFields(
            { name: "📁 Category", value: `${category}`, inline: true },
            { name: "👥 Support Role", value: supportRole ? `${supportRole}` : "None", inline: true },
            { name: "📝 Log Channel", value: logChannel ? `${logChannel}` : "None", inline: true },
            { name: "🎫 Max Tickets/User", value: `${maxTickets}`, inline: true },
          )
          .setFooter({ text: "RYZENX™ Ticket System • Use /ticket panel to deploy" })
          .setTimestamp()],
        ephemeral: true,
      });
    }

    // ── PANEL ──────────────────────────────────────────────────────
    if (sub === "panel") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({ content: "❌ You need **Manage Server** permission.", ephemeral: true });
      }
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const title = interaction.options.getString("title") || "🎫 Support Center";
      const description = interaction.options.getString("description") ||
        "Need help? Click the button below to open a support ticket.\nOur team will assist you as soon as possible!";

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(title)
        .setDescription(description)
        .addFields(
          { name: "📋 Before opening a ticket", value: "• Search existing answers first\n• Be clear and specific about your issue\n• Include relevant screenshots/details" },
          { name: "⏰ Response Time", value: "Our team will respond as soon as possible." },
        )
        .setFooter({ text: "RYZENX™ Ticket System" })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ticket_create_btn").setLabel("🎫 Open Ticket").setStyle(ButtonStyle.Primary),
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Ticket panel deployed to ${channel}!`, ephemeral: true });
    }

    // ── CREATE ─────────────────────────────────────────────────────
    if (sub === "create") {
      const config = await pool.query("SELECT * FROM ticket_settings WHERE guild_id = $1", [guild.id]);
      if (!config.rows.length) {
        return interaction.reply({ content: "❌ Ticket system not configured. Ask an admin to use `/ticket setup`.", ephemeral: true });
      }
      const cfg = config.rows[0];
      const maxTickets = cfg.max_tickets ?? 1;

      const existing = await pool.query(
        "SELECT COUNT(*) FROM tickets WHERE user_id = $1 AND guild_id = $2 AND status = 'open'",
        [interaction.user.id, guild.id]
      );
      if (parseInt(existing.rows[0].count) >= maxTickets) {
        return interaction.reply({ content: `❌ You already have **${existing.rows[0].count}** open ticket(s). Maximum is **${maxTickets}**.`, ephemeral: true });
      }

      const topic = interaction.options.getString("topic");
      const priority = interaction.options.getString("priority") ?? "medium";
      await interaction.deferReply({ ephemeral: true });
      const channel = await createTicketChannel(guild, interaction.user.id, topic, cfg, priority);
      return interaction.editReply({ content: `✅ Ticket created: ${channel}` });
    }

    // ── TICKET-SPECIFIC COMMANDS ───────────────────────────────────
    const ticket = await pool.query("SELECT * FROM tickets WHERE channel_id = $1", [interaction.channelId]);

    if (sub === "close") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const reason = interaction.options.getString("reason") || "No reason provided";
      const channel = interaction.channel as TextChannel;

      await pool.query("UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE channel_id = $1", [interaction.channelId]);
      await channel.permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: false }).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔒 Ticket Closed")
        .addFields(
          { name: "Closed by", value: interaction.user.tag, inline: true },
          { name: "Reason", value: reason, inline: true },
        )
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ticket_reopen_btn").setLabel("🔓 Reopen").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ticket_delete_btn").setLabel("🗑️ Delete").setStyle(ButtonStyle.Danger),
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: "✅ Ticket closed.", ephemeral: true });
    }

    if (sub === "reopen") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      await pool.query("UPDATE tickets SET status = 'open', closed_at = NULL WHERE channel_id = $1", [interaction.channelId]);
      await (interaction.channel as TextChannel).permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: true }).catch(() => {});
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription("🔓 Ticket **reopened**!")] });
    }

    if (sub === "add") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const target = interaction.options.getUser("user", true);
      await (interaction.channel as TextChannel).permissionOverwrites.edit(target, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
      });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`➕ Added **${target.tag}** to the ticket.`)] });
    }

    if (sub === "remove") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const target = interaction.options.getUser("user", true);
      await (interaction.channel as TextChannel).permissionOverwrites.edit(target, { ViewChannel: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`➖ Removed **${target.tag}** from the ticket.`)] });
    }

    if (sub === "rename") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const name = interaction.options.getString("name", true);
      await (interaction.channel as TextChannel).setName(name);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✏️ Ticket renamed to **${name}**`)] });
    }

    if (sub === "claim") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      await pool.query("UPDATE tickets SET claimed_by = $1 WHERE channel_id = $2", [interaction.user.id, interaction.channelId]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`📌 Ticket claimed by **${interaction.user.tag}**`)] });
    }

    if (sub === "unclaim") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      await pool.query("UPDATE tickets SET claimed_by = NULL WHERE channel_id = $1", [interaction.channelId]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xffaa00).setDescription("📌 Ticket unclaimed.")] });
    }

    if (sub === "priority") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const level = interaction.options.getString("level", true);
      await pool.query("UPDATE tickets SET priority = $1 WHERE channel_id = $2", [level, interaction.channelId]);
      const emoji = PRIORITY_EMOJIS[level];
      const color = PRIORITY_COLORS[level];
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(color).setDescription(`${emoji} Ticket priority set to **${level.charAt(0).toUpperCase() + level.slice(1)}**`)],
      });
    }

    if (sub === "transcript") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      const channel = interaction.channel as TextChannel;

      const messages = await channel.messages.fetch({ limit: 100 });
      const sorted = [...messages.values()].reverse();
      const lines = sorted.map((m) => {
        const ts = new Date(m.createdTimestamp).toISOString();
        const content = m.content || (m.embeds.length ? "[Embed]" : "[Attachment]");
        return `[${ts}] ${m.author.tag}: ${content}`;
      });

      const text = `RYZENX™ Ticket Transcript\nChannel: ${channel.name}\nDate: ${new Date().toISOString()}\n${"─".repeat(60)}\n${lines.join("\n")}`;
      const buffer = Buffer.from(text, "utf-8");

      return interaction.editReply({
        content: "📄 Here is the ticket transcript:",
        files: [{ attachment: buffer, name: `transcript-${channel.name}.txt` }],
      });
    }

    if (sub === "delete") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      await pool.query("DELETE FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      await interaction.reply({ content: "🗑️ Deleting in 3 seconds...", ephemeral: true });
      setTimeout(() => (interaction.channel as TextChannel).delete().catch(() => {}), 3000);
      return;
    }

    if (sub === "list") {
      const result = await pool.query(
        "SELECT * FROM tickets WHERE guild_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 20",
        [guild.id]
      );
      if (!result.rows.length) return interaction.reply({ content: "✅ No open tickets!", ephemeral: true });

      const lines = result.rows.map((t: any) => {
        const emoji = PRIORITY_EMOJIS[t.priority] || "🔵";
        return `${emoji} <#${t.channel_id}> — <@${t.user_id}>${t.claimed_by ? ` | 📌 <@${t.claimed_by}>` : ""} | ${t.topic?.substring(0, 40) || "No topic"}`;
      });

      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2)
          .setTitle(`🎫 Open Tickets (${result.rows.length})`)
          .setDescription(lines.join("\n"))
          .setFooter({ text: "RYZENX™ Ticket System" })
          .setTimestamp()],
        ephemeral: true,
      });
    }

    if (sub === "info") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ Not a ticket channel.", ephemeral: true });
      const t = ticket.rows[0];
      const emoji = PRIORITY_EMOJIS[t.priority] || "🔵";
      const color = PRIORITY_COLORS[t.priority] || 0x5865f2;
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`🎫 Ticket Information`)
        .addFields(
          { name: "👤 Created By", value: `<@${t.user_id}>`, inline: true },
          { name: "📋 Topic", value: t.topic || "None", inline: true },
          { name: `${emoji} Priority`, value: t.priority || "medium", inline: true },
          { name: "📌 Status", value: t.status, inline: true },
          { name: "🔖 Claimed By", value: t.claimed_by ? `<@${t.claimed_by}>` : "Unclaimed", inline: true },
          { name: "📅 Created", value: `<t:${Math.floor(new Date(t.created_at).getTime() / 1000)}:R>`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Ticket System" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
