import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { calculateLevel, xpForLevel } from "../../handlers/leveling";

function rankMedal(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (rank <= 10) return "🏅";
  return `#${rank}`;
}

function xpBar(current: number, needed: number): string {
  const pct = Math.min(Math.floor((current / needed) * 20), 20);
  return "█".repeat(pct) + "░".repeat(20 - pct);
}

function levelColor(level: number): number {
  if (level >= 50) return 0xffd700;
  if (level >= 30) return 0xe91e63;
  if (level >= 20) return 0x9c27b0;
  if (level >= 10) return 0x2196f3;
  return 0x00ff88;
}

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("⭐ View XP rank, level & progress bar")
    .addUserOption((opt) => opt.setName("user").setDescription("User to check")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;

    const result = await pool.query(
      "SELECT * FROM user_levels WHERE user_id = $1 AND guild_id = $2",
      [target.id, interaction.guild!.id]
    );

    if (!result.rows.length) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x888888).setDescription(`📭 **${target.username}** hasn't sent any messages yet!`)],
        ephemeral: true,
      });
    }

    const { xp, total_messages } = result.rows[0];
    const level = calculateLevel(xp);
    const currentLevelXP = xpForLevel(level);
    const nextLevelXP = xpForLevel(level + 1);
    const progressXP = xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const percent = Math.min(Math.floor((progressXP / neededXP) * 100), 100);

    const rankResult = await pool.query(
      "SELECT user_id FROM user_levels WHERE guild_id = $1 ORDER BY xp DESC",
      [interaction.guild!.id]
    );
    const rank = rankResult.rows.findIndex((r: any) => r.user_id === target.id) + 1;
    const medal = rankMedal(rank);

    const color = levelColor(level);
    const bar = xpBar(progressXP, neededXP);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: `${target.username}  •  Level ${level}`, iconURL: target.displayAvatarURL({ size: 128 }) })
      .setTitle(`${medal} Server Rank`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🏆 Rank", value: `**${medal}** of ${rankResult.rows.length}`, inline: true },
        { name: "⭐ Level", value: `**${level}**`, inline: true },
        { name: "✨ Total XP", value: `**${xp.toLocaleString()}**`, inline: true },
        { name: "💬 Messages", value: `**${total_messages.toLocaleString()}**`, inline: true },
        { name: `📈 Progress to Level ${level + 1}`, value: `\`[${bar}]\` **${percent}%**\n${progressXP.toLocaleString()} / ${neededXP.toLocaleString()} XP needed`, inline: false },
      )
      .setFooter({ text: "RYZENX™ Leveling  •  Keep chatting to earn XP!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
