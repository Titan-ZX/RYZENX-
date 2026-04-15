import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("🏦 Withdraw coins from your bank")
    .addStringOption((opt) => opt.setName("amount").setDescription('Amount to withdraw (or "all")').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const input = interaction.options.getString("amount", true);
    const amount = input.toLowerCase() === "all" ? eco.bank : parseInt(input);

    if (isNaN(amount) || amount < 1) return interaction.reply({ content: "❌ Invalid amount.", ephemeral: true });
    if (eco.bank < amount) return interaction.reply({ content: `❌ Insufficient bank balance. You have 🪙 ${eco.bank.toLocaleString()} in bank.`, ephemeral: true });

    await pool.query(
      "UPDATE economy SET wallet = wallet + $1, bank = bank - $1 WHERE user_id = $2 AND guild_id = $3",
      [amount, interaction.user.id, interaction.guild!.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🏦 Withdrawal Successful")
      .setDescription(`Withdrew **🪙 ${amount.toLocaleString()} coins** from your bank!`)
      .addFields(
        { name: "👛 Wallet", value: `🪙 ${(eco.wallet + amount).toLocaleString()}`, inline: true },
        { name: "🏦 Bank", value: `🪙 ${(eco.bank - amount).toLocaleString()}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy System" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
