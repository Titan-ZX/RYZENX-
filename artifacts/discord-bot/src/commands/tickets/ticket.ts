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
} from "discord.js";
import { pool } from "../../database";

export async function createTicketChannel(
  guild: any,
  userId: string,
  topic: string | null,
  config: any
): Promise<TextChannel> {
  await pool.query("UPDATE ticket_settings SET ticket_count = ticket_count + 1 WHERE guild_id = $1", [guild.id]);
  const countRes = await pool.query("SELECT ticket_count FROM ticket_settings WHERE guild_id = $1", [guild.id]);
  const count = countRes.rows[0]?.ticket_count || 1;

  const channelName = `🎫-ticket-${count.toString().padStart(4, "0")}`;
  const overwrites: any[] = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: userId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];

  if (config.support_role) {
    overwrites.push({
      id: config.support_role,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: config.category_id,
    permissionOverwrites: overwrites,
  }) as TextChannel;

  await pool.query(
    "INSERT INTO tickets (guild_id, channel_id, user_id, topic) VALUES ($1, $2, $3, $4)",
    [guild.id, channel.id, userId, topic || "No topic specified"]
  );

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎫 Support Ticket Created")
    .setDescription(`Hello <@${userId}>! Support staff will be with you shortly.\n\n**Topic:** ${topic || "No topic specified"}`)
    .addFields({ name: "📋 How to close", value: "Use `/ticket close` or click the button below." })
    .setFooter({ text: "RYZENX™ Ticket System" })
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Close Ticket").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket_claim_btn").setLabel("📌 Claim").setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ content: `<@${userId}>${config.support_role ? ` | <@&${config.support_role}>` : ""}`, embeds: [embed], components: [row] });
  return channel;
}

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("🎫 Ticket system management")
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("⚙️ Set up the ticket system")
        .addChannelOption((opt) => opt.setName("category").setDescription("Category for tickets").setRequired(true))
        .addRoleOption((opt) => opt.setName("support_role").setDescription("Support staff role"))
        .addChannelOption((opt) => opt.setName("log_channel").setDescription("Log channel for tickets"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("panel")
        .setDescription("📌 Send ticket panel to a channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to send panel in").setRequired(true))
        .addStringOption((opt) => opt.setName("description").setDescription("Panel description"))
    )
    .addSubcommand((sub) =>
      sub.setName("create").setDescription("🎫 Open a new support ticket")
        .addStringOption((opt) => opt.setName("topic").setDescription("Reason for the ticket"))
    )
    .addSubcommand((sub) =>
      sub.setName("close").setDescription("🔒 Close this ticket")
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for closing"))
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
      sub.setName("rename").setDescription("✏️ Rename this ticket channel")
        .addStringOption((opt) => opt.setName("name").setDescription("New name").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("claim").setDescription("📌 Claim this ticket as support staff"))
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("🗑️ Permanently delete this ticket")
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("📋 List all open tickets")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === "setup") {
      const category = interaction.options.getChannel("category", true);
      const supportRole = interaction.options.getRole("support_role");
      const logChannel = interaction.options.getChannel("log_channel");

      await pool.query(
        "INSERT INTO ticket_settings (guild_id, category_id, support_role, log_channel) VALUES ($1, $2, $3, $4) ON CONFLICT (guild_id) DO UPDATE SET category_id = $2, support_role = $3, log_channel = $4",
        [guild.id, category.id, supportRole?.id || null, logChannel?.id || null]
      );

      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("✅ Ticket System Configured!")
        .addFields(
          { name: "📁 Category", value: `${category}`, inline: true },
          { name: "👥 Support Role", value: supportRole ? `${supportRole}` : "Not set", inline: true },
          { name: "📝 Log Channel", value: logChannel ? `${logChannel}` : "Not set", inline: true },
        )
        .setFooter({ text: "RYZENX™ Ticket System • Use /ticket panel to deploy" })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "panel") {
      const channel = interaction.options.getChannel("channel", true) as TextChannel;
      const description = interaction.options.getString("description") || "Click the button below to open a support ticket. Our team will assist you shortly.";

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎫 Support Center")
        .setDescription(description)
        .addFields(
          { name: "📋 Before opening a ticket", value: "• Check the FAQ first\n• Be clear about your issue\n• Provide relevant details" },
        )
        .setFooter({ text: "RYZENX™ Ticket System" })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ticket_create_btn").setLabel("🎫 Open Ticket").setStyle(ButtonStyle.Primary)
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: `✅ Ticket panel sent to ${channel}!`, ephemeral: true });
    }

    if (sub === "create") {
      const topic = interaction.options.getString("topic");
      const config = await pool.query("SELECT * FROM ticket_settings WHERE guild_id = $1", [guild.id]);
      if (!config.rows.length) return interaction.reply({ content: "❌ Ticket system not configured. Ask an admin to run `/ticket setup`.", ephemeral: true });

      await interaction.deferReply({ ephemeral: true });
      const channel = await createTicketChannel(guild, interaction.user.id, topic, config.rows[0]);
      return interaction.editReply({ content: `✅ Your ticket has been created: ${channel}` });
    }

    const ticket = await pool.query("SELECT * FROM tickets WHERE channel_id = $1", [interaction.channelId]);

    if (sub === "close") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      const reason = interaction.options.getString("reason") || "No reason provided";
      const channel = interaction.channel as TextChannel;

      await pool.query("UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE channel_id = $1", [interaction.channelId]);
      await channel.permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: false });

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🔒 Ticket Closed")
        .addFields(
          { name: "Closed by", value: `${interaction.user.tag}`, inline: true },
          { name: "Reason", value: reason, inline: true },
        )
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("ticket_reopen_btn").setLabel("🔓 Reopen").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ticket_delete_btn").setLabel("🗑️ Delete").setStyle(ButtonStyle.Danger)
      );

      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: "✅ Ticket closed.", ephemeral: true });
    }

    if (sub === "reopen") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      const channel = interaction.channel as TextChannel;
      await pool.query("UPDATE tickets SET status = 'open', closed_at = NULL WHERE channel_id = $1", [interaction.channelId]);
      await channel.permissionOverwrites.edit(ticket.rows[0].user_id, { SendMessages: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription("🔓 Ticket reopened!")] });
    }

    if (sub === "add") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      const target = interaction.options.getUser("user", true);
      const channel = interaction.channel as TextChannel;
      await channel.permissionOverwrites.edit(target, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`➕ Added **${target.tag}** to the ticket.`)] });
    }

    if (sub === "remove") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      const target = interaction.options.getUser("user", true);
      const channel = interaction.channel as TextChannel;
      await channel.permissionOverwrites.edit(target, { ViewChannel: false });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`➖ Removed **${target.tag}** from the ticket.`)] });
    }

    if (sub === "rename") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      const name = interaction.options.getString("name", true);
      await (interaction.channel as TextChannel).setName(name);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✏️ Ticket renamed to **${name}**`)] });
    }

    if (sub === "claim") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      await pool.query("UPDATE tickets SET claimed_by = $1 WHERE channel_id = $2", [interaction.user.id, interaction.channelId]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`📌 Ticket claimed by **${interaction.user.tag}**`)] });
    }

    if (sub === "delete") {
      if (!ticket.rows.length) return interaction.reply({ content: "❌ This is not a ticket channel.", ephemeral: true });
      await pool.query("DELETE FROM tickets WHERE channel_id = $1", [interaction.channelId]);
      await interaction.reply({ content: "🗑️ Deleting ticket in 3 seconds...", ephemeral: true });
      setTimeout(() => (interaction.channel as TextChannel).delete().catch(() => {}), 3000);
    }

    if (sub === "list") {
      const result = await pool.query(
        "SELECT * FROM tickets WHERE guild_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 15",
        [guild.id]
      );
      if (!result.rows.length) return interaction.reply({ content: "✅ No open tickets!", ephemeral: true });

      const lines = result.rows.map(
        (t: any) => `<#${t.channel_id}> — <@${t.user_id}> | ${t.topic || "No topic"}`
      );

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🎫 Open Tickets (${result.rows.length})`)
        .setDescription(lines.join("\n"))
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
