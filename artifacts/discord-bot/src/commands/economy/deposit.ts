import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("🏦 Deposit coins to your bank")
    .addStringOption((opt) => opt.setName("amount").setDescription('Amount to deposit (or "all")').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const eco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const input = interaction.options.getString("amount", true);
    const amount = input.toLowerCase() === "all" ? eco.wallet : parseInt(input);

    if (isNaN(amount) || amount < 1) return interaction.reply({ content: "❌ Invalid amount.", ephemeral: true });
    if (eco.wallet < amount) return interaction.reply({ content: `❌ Insufficient wallet balance. You have 🪙 ${eco.wallet.toLocaleString()}.`, ephemeral: true });

    await pool.query(
      "UPDATE economy SET wallet = wallet - $1, bank = bank + $1 WHERE user_id = $2 AND guild_id = $3",
      [amount, interaction.user.id, interaction.guild!.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🏦 Deposit Successful")
      .setDescription(`Deposited **🪙 ${amount.toLocaleString()} coins** to your bank!`)
      .addFields(
        { name: "👛 Wallet", value: `🪙 ${(eco.wallet - amount).toLocaleString()}`, inline: true },
        { name: "🏦 Bank", value: `🪙 ${(eco.bank + amount).toLocaleString()}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy • Bank coins are safe from robberies" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
