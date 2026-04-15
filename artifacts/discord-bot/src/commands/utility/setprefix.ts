import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { updateGuildSettings } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("setprefix")
    .setDescription("Set a custom command prefix for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((opt) =>
      opt.setName("prefix").setDescription("New prefix (e.g. !, ?, ., $)").setRequired(true).setMaxLength(5)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const prefix = interaction.options.getString("prefix", true);
    await updateGuildSettings(interaction.guild!.id, { prefix });

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("⚙️ Prefix Updated")
      .setDescription(`Custom prefix for **${interaction.guild!.name}** is now \`${prefix}\`\n\nUse \`${prefix}help\` or mention me to get started!`)
      .setFooter({ text: "RYZENX™ System" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
