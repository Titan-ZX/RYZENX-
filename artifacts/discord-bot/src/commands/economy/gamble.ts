import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("🎲 Gamble your coins — double or nothing!")
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount to gamble (or 'all')").setRequired(true).setMinValue(10)),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount", true);
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);

    const bet = Math.min(amount, eco.wallet);
    if (bet < 10) return interaction.reply({ content: "❌ You need at least 🪙 10 in your wallet to gamble.", ephemeral: true });

    const roll = Math.random();
    const won = roll > 0.48;
    const multiplier = roll > 0.98 ? 3 : roll > 0.90 ? 2.5 : 2;
    const net = won ? Math.floor(bet * (multiplier - 1)) : -bet;

    await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [net, interaction.user.id, interaction.guild!.id]);

    const diceEmoji = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][Math.floor(Math.random() * 6)];
    const embed = new EmbedBuilder()
      .setColor(won ? 0x00ff88 : 0xff0000)
      .setTitle(`🎲 Gamble — ${won ? "YOU WON!" : "You Lost!"}`)
      .setDescription(`${diceEmoji} The dice rolled...`)
      .addFields(
        { name: "💰 Bet", value: `🪙 ${bet.toLocaleString()}`, inline: true },
        { name: won ? "💵 Won" : "💸 Lost", value: `🪙 ${Math.abs(net).toLocaleString()}`, inline: true },
        { name: "👛 New Wallet", value: `🪙 ${(eco.wallet + net).toLocaleString()}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy • 48% win chance, rare 2.5x and 3x multipliers!" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
