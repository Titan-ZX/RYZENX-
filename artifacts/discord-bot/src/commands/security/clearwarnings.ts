import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("clearwarnings")
    .setDescription("Clear all warnings for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((opt) => opt.setName("user").setDescription("User to clear warnings for").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const result = await pool.query(
      "DELETE FROM warnings WHERE user_id = $1 AND guild_id = $2 RETURNING id",
      [target.id, interaction.guild!.id]
    );
    await interaction.reply({ content: `✅ Cleared **${result.rowCount}** warning(s) for ${target.tag}.`, ephemeral: true });
  },
};
