import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

function wealthTier(net: number): { label: string; emoji: string; color: number } {
  if (net >= 1000000) return { label: "Trillionaire", emoji: "👑", color: 0xffd700 };
  if (net >= 500000) return { label: "Millionaire", emoji: "💎", color: 0x00ffff };
  if (net >= 100000) return { label: "Rich", emoji: "💰", color: 0x00ff88 };
  if (net >= 50000) return { label: "Wealthy", emoji: "🏦", color: 0x66ff66 };
  if (net >= 10000) return { label: "Comfortable", emoji: "💵", color: 0xffaa00 };
  if (net >= 1000) return { label: "Getting There", emoji: "🪙", color: 0x5865f2 };
  return { label: "Broke", emoji: "🪨", color: 0x888888 };
}

function coinBar(wallet: number, bank: number): string {
  const total = wallet + bank;
  if (total === 0) return "▱".repeat(10);
  const walletPct = Math.min(Math.floor((wallet / total) * 10), 10);
  return "█".repeat(walletPct) + "▱".repeat(10 - walletPct);
}

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 View your coin balance, bank & net worth")
    .addUserOption((opt) => opt.setName("user").setDescription("View another user's balance")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const eco = await getOrCreateEconomy(target.id, interaction.guild!.id);

    const net = eco.wallet + eco.bank;
    const tier = wealthTier(net);
    const rankRes = await pool.query(
      "SELECT user_id FROM economy WHERE guild_id = $1 ORDER BY (wallet + bank) DESC",
      [interaction.guild!.id]
    );
    const serverRank = rankRes.rows.findIndex((r: any) => r.user_id === target.id) + 1;

    const embed = new EmbedBuilder()
      .setColor(tier.color)
      .setAuthor({ name: `${target.username}'s Economy`, iconURL: target.displayAvatarURL({ size: 128 }) })
      .setTitle(`${tier.emoji} ${tier.label}`)
      .setDescription(`> 💹 Server rank **#${serverRank}**\n> Wallet vs Bank ratio:\n> \`[${coinBar(eco.wallet, eco.bank)}]\``)
      .addFields(
        {
          name: "👛 Wallet",
          value: `🪙 **${eco.wallet.toLocaleString()}**`,
          inline: true,
        },
        {
          name: "🏦 Bank",
          value: `🪙 **${eco.bank.toLocaleString()}**`,
          inline: true,
        },
        {
          name: "💎 Net Worth",
          value: `🪙 **${net.toLocaleString()}**`,
          inline: true,
        },
      )
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .setFooter({ text: "RYZENX™ Economy  •  /daily /work /fish /hunt /mine to earn" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
