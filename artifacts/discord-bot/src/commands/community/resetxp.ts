import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("resetxp")
    .setDescription("🔄 Reset XP for a user or the entire server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName("user").setDescription("User to reset (leave empty to reset ALL)"))
    .addBooleanOption((opt) => opt.setName("confirm").setDescription("Confirm server-wide reset").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user");

    if (target) {
      await pool.query("UPDATE user_levels SET xp = 0, level = 0 WHERE user_id = $1 AND guild_id = $2", [target.id, interaction.guild!.id]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`🔄 XP reset for **${target.tag}**`)], ephemeral: true });
    }

    const confirm = interaction.options.getBoolean("confirm");
    if (!confirm) return interaction.reply({ content: "❌ To reset ALL server XP, set `confirm: True`!", ephemeral: true });

    await pool.query("UPDATE user_levels SET xp = 0, level = 0 WHERE guild_id = $1", [interaction.guild!.id]);
    return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setTitle("🔄 Server XP Reset!").setDescription("All member XP and levels have been reset to 0.")] });
  },
};
