import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("noexp")
    .setDescription("🚫 Disable XP gain in specific channels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("➕ Disable XP in a channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("➖ Re-enable XP in a channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("📋 List all no-XP channels")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "add") {
      const ch = interaction.options.getChannel("channel", true);
      await pool.query("INSERT INTO noexp_channels (guild_id, channel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [guildId, ch.id]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`🚫 XP disabled in ${ch}`)], ephemeral: true });
    }

    if (sub === "remove") {
      const ch = interaction.options.getChannel("channel", true);
      await pool.query("DELETE FROM noexp_channels WHERE guild_id = $1 AND channel_id = $2", [guildId, ch.id]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ XP re-enabled in ${ch}`)], ephemeral: true });
    }

    if (sub === "list") {
      const result = await pool.query("SELECT channel_id FROM noexp_channels WHERE guild_id = $1", [guildId]);
      if (!result.rows.length) return interaction.reply({ content: "✅ No no-XP channels configured.", ephemeral: true });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("🚫 No-XP Channels").setDescription(result.rows.map((r: any) => `<#${r.channel_id}>`).join("\n"))] });
    }
  },
};
