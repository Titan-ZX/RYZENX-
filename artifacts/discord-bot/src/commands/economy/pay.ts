import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("💸 Send coins to another user")
    .addUserOption((opt) => opt.setName("user").setDescription("User to pay").setRequired(true))
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Amount to send").setRequired(true).setMinValue(1)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);

    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't pay yourself.", ephemeral: true });
    if (target.bot) return interaction.reply({ content: "❌ You can't pay bots.", ephemeral: true });

    const senderEco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);

    if (senderEco.wallet < amount) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`❌ Insufficient funds. Wallet: 🪙 ${senderEco.wallet.toLocaleString()}`)],
        ephemeral: true,
      });
    }

    await getOrCreateEconomy(target.id, interaction.guild!.id);
    await pool.query("UPDATE economy SET wallet = wallet - $1 WHERE user_id = $2 AND guild_id = $3", [amount, interaction.user.id, interaction.guild!.id]);
    await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [amount, target.id, interaction.guild!.id]);

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("💸 Transaction Complete")
      .setDescription(`**${interaction.user.username}** sent **🪙 ${amount.toLocaleString()} coins** to **${target.username}**!`)
      .addFields(
        { name: "📤 Sender Wallet", value: `🪙 ${(senderEco.wallet - amount).toLocaleString()}`, inline: true },
        { name: "📥 Recipient", value: `${target}`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy System" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
