import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

const antinukeSettings = new Map<string, { enabled: boolean; threshold: number }>();

export function isAntinukeEnabled(guildId: string) { return antinukeSettings.get(guildId)?.enabled ?? false; }
export function getThreshold(guildId: string) { return antinukeSettings.get(guildId)?.threshold ?? 5; }

export default {
  data: new SlashCommandBuilder()
    .setName("antinuke")
    .setDescription("🛡️ Anti-Nuke protection system")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("enable").setDescription("✅ Enable anti-nuke protection")
        .addIntegerOption((opt) => opt.setName("threshold").setDescription("Actions per minute before triggering (default: 5)").setMinValue(2).setMaxValue(20))
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("❌ Disable anti-nuke protection"))
    .addSubcommand((sub) => sub.setName("status").setDescription("ℹ️ View anti-nuke status")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "enable") {
      const threshold = interaction.options.getInteger("threshold") || 5;
      antinukeSettings.set(guildId, { enabled: true, threshold });
      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("🛡️ Anti-Nuke Enabled!")
        .setDescription(`Server is now protected against mass destructive actions.\n\nIf any moderator performs more than **${threshold} channel/role deletions per minute**, they will be automatically stripped of permissions.`)
        .setFooter({ text: "RYZENX™ Security" }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "disable") {
      antinukeSettings.set(guildId, { enabled: false, threshold: 5 });
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("🛡️ Anti-Nuke **disabled**.")] });
    }

    if (sub === "status") {
      const settings = antinukeSettings.get(guildId) || { enabled: false, threshold: 5 };
      const embed = new EmbedBuilder()
        .setColor(settings.enabled ? 0x00ff88 : 0xff0000)
        .setTitle("🛡️ Anti-Nuke Status")
        .addFields(
          { name: "Status", value: settings.enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Threshold", value: `${settings.threshold} actions/min`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Security" }).setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
