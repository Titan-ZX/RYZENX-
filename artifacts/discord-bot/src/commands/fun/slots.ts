import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "💎", "🎰", "⭐", "🔔"];
const WEIGHTS = [30, 25, 20, 15, 3, 2, 3, 2];

function spinSlot(): string {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    rand -= WEIGHTS[i];
    if (rand <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function getMultiplier(s1: string, s2: string, s3: string): number {
  if (s1 === s2 && s2 === s3) {
    if (s1 === "💎") return 50;
    if (s1 === "🎰") return 30;
    if (s1 === "⭐") return 20;
    if (s1 === "🔔") return 15;
    if (s1 === "🍇") return 10;
    return 5;
  }
  if (s1 === s2 || s2 === s3 || s1 === s3) return 1.5;
  return 0;
}

export default {
  data: new SlashCommandBuilder()
    .setName("slots")
    .setDescription("🎰 Spin the slot machine!")
    .addIntegerOption((opt) => opt.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(10).setMaxValue(50000)),

  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger("bet", true);
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);

    if (eco.wallet < bet) {
      return interaction.reply({ content: `❌ Insufficient funds. You have 🪙 **${eco.wallet.toLocaleString()}** in your wallet.`, ephemeral: true });
    }

    const s1 = spinSlot(), s2 = spinSlot(), s3 = spinSlot();
    const multiplier = getMultiplier(s1, s2, s3);
    const won = Math.floor(bet * multiplier);
    const net = won - bet;

    await pool.query(
      "UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3",
      [net, interaction.user.id, interaction.guild!.id]
    );

    const color = multiplier === 0 ? 0xff0000 : multiplier >= 5 ? 0xffd700 : 0x00ff88;
    const resultText = multiplier === 0 ? `❌ **Lost!** -🪙${bet.toLocaleString()}` : multiplier >= 10 ? `💎 **JACKPOT! x${multiplier}** +🪙${won.toLocaleString()}!` : `✅ **Win! x${multiplier}** +🪙${won.toLocaleString()}`;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🎰 Slot Machine")
      .setDescription(`## | ${s1} | ${s2} | ${s3} |\n\n${resultText}`)
      .addFields(
        { name: "💰 Bet", value: `🪙 ${bet.toLocaleString()}`, inline: true },
        { name: "💵 Won", value: `🪙 ${won.toLocaleString()}`, inline: true },
        { name: "👛 Wallet", value: `🪙 ${(eco.wallet + net).toLocaleString()}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy • 💎=50x | 🎰=30x | ⭐=20x | 🔔=15x | 🍇=10x | others=5x" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
