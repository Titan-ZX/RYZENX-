import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const SUITS = ["♠️", "♥️", "♦️", "♣️"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function drawCard() {
  return { rank: RANKS[Math.floor(Math.random() * RANKS.length)], suit: SUITS[Math.floor(Math.random() * SUITS.length)] };
}

function cardValue(card: { rank: string }): number {
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 11;
  return parseInt(card.rank);
}

function handValue(hand: { rank: string }[]): number {
  let total = hand.reduce((a, c) => a + cardValue(c), 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function displayHand(hand: any[]): string {
  return hand.map((c) => `**${c.rank}${c.suit}**`).join(" ");
}

const activeGames = new Map<string, any>();

export default {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("🃏 Play Blackjack against the dealer")
    .addIntegerOption((opt) => opt.setName("bet").setDescription("Amount to bet").setRequired(true).setMinValue(10).setMaxValue(50000)),

  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger("bet", true);
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const key = `${interaction.user.id}-${interaction.guildId}`;

    if (activeGames.has(key)) return interaction.reply({ content: "❌ You already have an active game! Finish it first.", ephemeral: true });
    if (eco.wallet < bet) return interaction.reply({ content: `❌ Not enough coins. Wallet: 🪙 ${eco.wallet.toLocaleString()}`, ephemeral: true });

    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    const game = { playerHand, dealerHand, bet };
    activeGames.set(key, game);

    const playerVal = handValue(playerHand);

    if (playerVal === 21) {
      activeGames.delete(key);
      const won = Math.floor(bet * 1.5);
      await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [won, interaction.user.id, interaction.guild!.id]);
      const embed = new EmbedBuilder().setColor(0xffd700).setTitle("🃏 Blackjack — 🎉 BLACKJACK!")
        .setDescription(`Your hand: ${displayHand(playerHand)} = **${playerVal}**\n💎 **BLACKJACK!** You win **🪙 ${won.toLocaleString()}**!`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🃏 Blackjack")
      .addFields(
        { name: "🧑 Your Hand", value: `${displayHand(playerHand)} = **${playerVal}**`, inline: true },
        { name: "🤖 Dealer", value: `${displayHand([dealerHand[0]])} ❓`, inline: true },
        { name: "💰 Bet", value: `🪙 ${bet.toLocaleString()}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Blackjack • Hit or Stand?" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("bj_hit").setLabel("🎯 Hit").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("bj_stand").setLabel("✋ Stand").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
    await pool.query("UPDATE economy SET wallet = wallet - $1 WHERE user_id = $2 AND guild_id = $3", [bet, interaction.user.id, interaction.guild!.id]);
  },
};

export { activeGames, drawCard, handValue, displayHand };
