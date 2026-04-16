import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, TextChannel, Guild, GuildMember,
} from "discord.js";
import { pool, getGuildSettings, updateGuildSettings } from "../../database";

export async function logModAction(
  guild: Guild,
  action: string,
  target: { id: string; tag: string },
  moderator: { id: string; tag: string },
  reason: string,
  color: number,
  extra?: Record<string, string>
) {
  try {
    const settings = await getGuildSettings(guild.id);
    const logChannelId = settings.mod_log_channel || settings.log_channel;
    if (!logChannelId) return;

    const logChannel = guild.channels.cache.get(logChannelId) as TextChannel;
    if (!logChannel) return;

    // Insert into warnings
    const caseResult = await pool.query(
      "INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4) RETURNING id",
      [target.id, guild.id, moderator.id, `${action}: ${reason}`]
    );
    const caseId = caseResult.rows[0]?.id;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${action}`)
      .addFields(
        { name: "👤 User", value: `${target.tag} \`${target.id}\``, inline: true },
        { name: "👮 Moderator", value: `${moderator.tag}`, inline: true },
        { name: "📋 Reason", value: reason, inline: false },
        ...(extra ? Object.entries(extra).map(([k, v]) => ({ name: k, value: v, inline: true })) : []),
        { name: "🗂️ Case ID", value: `#${caseId || "N/A"}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Mod Log" })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch {}
}

export default {
  data: new SlashCommandBuilder()
    .setName("modlog")
    .setDescription("📋 Manage the mod log channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("set").setDescription("📍 Set the mod log channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Log channel").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("❌ Disable mod logging")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("ℹ️ Check mod log status")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildSettings(interaction.guild!.id, { mod_log_channel: channel.id });
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ Mod log channel set to ${channel}`)],
        ephemeral: true,
      });
    }

    if (sub === "disable") {
      await updateGuildSettings(interaction.guild!.id, { mod_log_channel: null });
      return interaction.reply({ content: "✅ Mod logging disabled.", ephemeral: true });
    }

    if (sub === "status") {
      const settings = await getGuildSettings(interaction.guild!.id);
      const ch = settings.mod_log_channel ? `<#${settings.mod_log_channel}>` : "Not set";
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865f2)
          .setTitle("📋 Mod Log Status")
          .addFields({ name: "📍 Log Channel", value: ch, inline: true })
          .setFooter({ text: "RYZENX™" })],
        ephemeral: true,
      });
    }
  },
};
