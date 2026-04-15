import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("💤 Set your AFK status")
    .addStringOption((opt) => opt.setName("reason").setDescription("AFK reason").setMaxLength(150)),

  async execute(interaction: ChatInputCommandInteraction) {
    const reason = interaction.options.getString("reason") || "AFK";
    await pool.query(
      "INSERT INTO afk_users (user_id, guild_id, reason) VALUES ($1, $2, $3) ON CONFLICT (user_id, guild_id) DO UPDATE SET reason = $3, since = NOW()",
      [interaction.user.id, interaction.guild!.id, reason]
    );

    const embed = new EmbedBuilder()
      .setColor(0x888888)
      .setTitle("💤 AFK Status Set")
      .setDescription(`You are now AFK: **${reason}**\nI'll let people know when they mention you.`)
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
