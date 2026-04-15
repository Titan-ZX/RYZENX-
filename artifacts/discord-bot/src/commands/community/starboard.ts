import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

const starboardSettings = new Map<string, { channelId: string; threshold: number }>();

export function getStarboard(guildId: string) { return starboardSettings.get(guildId); }

export default {
  data: new SlashCommandBuilder()
    .setName("starboard")
    .setDescription("⭐ Configure the Starboard system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("⚙️ Set up starboard")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Starboard channel").setRequired(true))
        .addIntegerOption((opt) => opt.setName("threshold").setDescription("Stars needed (default: 3)").setMinValue(1).setMaxValue(20))
    )
    .addSubcommand((sub) => sub.setName("disable").setDescription("❌ Disable starboard")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const threshold = interaction.options.getInteger("threshold") || 3;
      starboardSettings.set(interaction.guild!.id, { channelId: channel.id, threshold });

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("⭐ Starboard Configured!")
        .addFields(
          { name: "📍 Channel", value: `${channel}`, inline: true },
          { name: "⭐ Threshold", value: `${threshold} stars`, inline: true },
        )
        .setFooter({ text: "RYZENX™ Community" }).setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "disable") {
      starboardSettings.delete(interaction.guild!.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("⭐ Starboard disabled.")] });
    }
  },
};
