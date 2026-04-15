import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("richlb")
    .setDescription("💎 View the richest members leaderboard"),

  async execute(interaction: ChatInputCommandInteraction) {
    const result = await pool.query(
      "SELECT * FROM economy WHERE guild_id = $1 ORDER BY (wallet + bank) DESC LIMIT 10",
      [interaction.guild!.id]
    );

    if (!result.rows.length) return interaction.reply({ content: "No economy data yet!", ephemeral: true });

    const medals = ["🥇", "🥈", "🥉"];
    const lines = result.rows.map((row: any, i: number) => {
      const total = row.wallet + row.bank;
      return `${medals[i] || `**${i + 1}.**`} <@${row.user_id}> — 🪙 **${total.toLocaleString()}** | 👛 ${row.wallet.toLocaleString()} + 🏦 ${row.bank.toLocaleString()}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`💎 Richest Members — ${interaction.guild!.name}`)
      .setDescription(lines.join("\n"))
      .setThumbnail(interaction.guild!.iconURL())
      .setFooter({ text: "RYZENX™ Economy • Net worth = Wallet + Bank" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
