import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { calculateLevel, xpForLevel } from "../../handlers/leveling";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your or another user's XP rank")
    .addUserOption((opt) => opt.setName("user").setDescription("User to check rank for")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;

    const result = await pool.query(
      "SELECT * FROM user_levels WHERE user_id = $1 AND guild_id = $2",
      [target.id, interaction.guild!.id]
    );

    if (!result.rows.length) {
      return interaction.reply({ content: `${target.username} hasn't earned any XP yet!`, ephemeral: true });
    }

    const userData = result.rows[0];
    const level = calculateLevel(userData.xp);
    const currentLevelXP = xpForLevel(level);
    const nextLevelXP = xpForLevel(level + 1);
    const progressXP = userData.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const percent = Math.min(Math.floor((progressXP / neededXP) * 100), 100);
    const bar = "█".repeat(Math.floor(percent / 10)) + "░".repeat(10 - Math.floor(percent / 10));

    const rankResult = await pool.query(
      "SELECT user_id FROM user_levels WHERE guild_id = $1 ORDER BY xp DESC",
      [interaction.guild!.id]
    );
    const rank = rankResult.rows.findIndex((r: any) => r.user_id === target.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle(`📊 ${target.username}'s Rank`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "🏆 Rank", value: `#${rank} of ${rankResult.rows.length}`, inline: true },
        { name: "⭐ Level", value: level.toString(), inline: true },
        { name: "✨ XP", value: `${userData.xp}`, inline: true },
        { name: "💬 Messages", value: userData.total_messages.toString(), inline: true },
        { name: `Progress to Level ${level + 1}`, value: `\`${bar}\` ${percent}%\n${progressXP}/${neededXP} XP` },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
