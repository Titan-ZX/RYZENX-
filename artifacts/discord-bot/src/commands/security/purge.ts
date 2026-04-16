import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  Message,
} from "discord.js";

async function smartDelete(channel: TextChannel, filter: (m: Message) => boolean, amount: number): Promise<number> {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const fetched = await channel.messages.fetch({ limit: 100 });
  const toDelete = fetched
    .filter((m) => filter(m) && m.createdTimestamp > cutoff)
    .first(amount);
  if (!toDelete.length) return 0;
  const deleted = await channel.bulkDelete(toDelete, true).catch(() => null);
  return deleted?.size ?? toDelete.length;
}

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("🗑️ Advanced purge system — filter by type, user, or content")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub.setName("all").setDescription("🗑️ Purge any messages")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("user").setDescription("👤 Purge messages from a specific user")
        .addUserOption((opt) => opt.setName("user").setDescription("Target user").setRequired(true))
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("bots").setDescription("🤖 Purge bot messages only")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("links").setDescription("🔗 Purge messages containing links")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("images").setDescription("🖼️ Purge messages with images or attachments")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("embeds").setDescription("📋 Purge messages with embeds")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("contains").setDescription("🔍 Purge messages containing specific text")
        .addStringOption((opt) => opt.setName("text").setDescription("Text to match").setRequired(true))
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("mentions").setDescription("🏷️ Purge messages that contain @mentions")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    )
    .addSubcommand((sub) =>
      sub.setName("invites").setDescription("📩 Purge Discord invite links")
        .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount (1–100)").setMinValue(1).setMaxValue(100))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const channel = interaction.channel as TextChannel;
    const urlRe = /https?:\/\/[^\s]+/gi;
    const inviteRe = /(discord\.gg|discord\.com\/invite)\//gi;

    let deleted = 0;
    let label = "";

    if (sub === "all") {
      const n = interaction.options.getInteger("amount", true);
      deleted = await smartDelete(channel, () => true, n);
      label = `${deleted} message${deleted !== 1 ? "s" : ""}`;
    }
    if (sub === "user") {
      const u = interaction.options.getUser("user", true);
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => m.author.id === u.id, n);
      label = `${deleted} message${deleted !== 1 ? "s" : ""} from **${u.username}**`;
    }
    if (sub === "bots") {
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => m.author.bot, n);
      label = `${deleted} bot message${deleted !== 1 ? "s" : ""}`;
    }
    if (sub === "links") {
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => { urlRe.lastIndex = 0; return urlRe.test(m.content); }, n);
      label = `${deleted} message${deleted !== 1 ? "s" : ""} with links`;
    }
    if (sub === "images") {
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => m.attachments.size > 0 || m.embeds.some(e => e.image != null || e.thumbnail != null), n);
      label = `${deleted} message${deleted !== 1 ? "s" : ""} with images`;
    }
    if (sub === "embeds") {
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => m.embeds.length > 0, n);
      label = `${deleted} embedded message${deleted !== 1 ? "s" : ""}`;
    }
    if (sub === "contains") {
      const text = interaction.options.getString("text", true).toLowerCase();
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => m.content.toLowerCase().includes(text), n);
      label = `${deleted} message${deleted !== 1 ? "s" : ""} containing "${text}"`;
    }
    if (sub === "mentions") {
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => m.mentions.users.size > 0 || m.mentions.roles.size > 0, n);
      label = `${deleted} mention message${deleted !== 1 ? "s" : ""}`;
    }
    if (sub === "invites") {
      const n = interaction.options.getInteger("amount") ?? 100;
      deleted = await smartDelete(channel, (m) => { inviteRe.lastIndex = 0; return inviteRe.test(m.content); }, n);
      label = `${deleted} invite message${deleted !== 1 ? "s" : ""}`;
    }

    const embed = new EmbedBuilder()
      .setColor(deleted > 0 ? 0x00ff88 : 0xff6600)
      .setTitle("🗑️ Purge Complete")
      .setDescription(`Successfully deleted **${label}**.`)
      .addFields(
        { name: "📋 Type", value: `\`${sub}\``, inline: true },
        { name: "📍 Channel", value: `${channel}`, inline: true },
        { name: "👮 Moderator", value: `${interaction.user.tag}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Purge System" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 6000);
  },
};
