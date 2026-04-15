import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { calculateLevel } from "../../handlers/leveling";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the server XP leaderboard"),

  async execute(interaction: ChatInputCommandInteraction) {
    const result = await pool.query(
      "SELECT * FROM user_levels WHERE guild_id = $1 ORDER BY xp DESC LIMIT 10",
      [interaction.guild!.id]
    );

    if (!result.rows.length) {
      return interaction.reply({ content: "No one has earned any XP yet!", ephemeral: true });
    }

    const medals = ["🥇", "🥈", "🥉"];
    const lines = result.rows.map((row: any, i: number) => {
      const level = calculateLevel(row.xp);
      const medal = medals[i] || `**${i + 1}.**`;
      return `${medal} <@${row.user_id}> — **Level ${level}** | ${row.xp} XP`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`🏆 XP Leaderboard — ${interaction.guild!.name}`)
      .setDescription(lines.join("\n"))
      .setThumbnail(interaction.guild!.iconURL())
      .setFooter({ text: "Top 10 members by XP" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
