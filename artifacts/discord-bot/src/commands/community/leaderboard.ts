import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { calculateLevel } from "../../handlers/leveling";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("🏆 View the server XP leaderboard"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const result = await pool.query(
      "SELECT * FROM user_levels WHERE guild_id = $1 ORDER BY xp DESC LIMIT 10",
      [interaction.guild!.id]
    );

    if (!result.rows.length) {
      return interaction.editReply({ content: "📭 No one has earned any XP yet! Start chatting!" });
    }

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const lines = result.rows.map((row: any, i: number) => {
      const level = calculateLevel(row.xp);
      const medal = medals[i];
      return `${medal} <@${row.user_id}>\n   ⭐ **Level ${level}** • ✨ ${row.xp.toLocaleString()} XP • 💬 ${row.total_messages.toLocaleString()} msgs`;
    });

    const topUser = result.rows[0];
    const topLevel = calculateLevel(topUser.xp);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL({ size: 128 }) ?? undefined })
      .setTitle("🏆 XP Leaderboard — Top 10")
      .setDescription(lines.join("\n\n"))
      .addFields({
        name: "👑 Current Champion",
        value: `<@${topUser.user_id}> at **Level ${topLevel}** with **${topUser.xp.toLocaleString()} XP**`,
        inline: false,
      })
      .setThumbnail(interaction.guild!.iconURL({ size: 256 }))
      .setFooter({ text: `RYZENX™ Community  •  ${result.rows.length} shown of ${(await pool.query("SELECT COUNT(*) FROM user_levels WHERE guild_id = $1", [interaction.guild!.id])).rows[0].count} total` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
