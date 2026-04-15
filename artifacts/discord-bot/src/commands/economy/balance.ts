import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("💰 View your coin balance")
    .addUserOption((opt) => opt.setName("user").setDescription("User to check")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const eco = await getOrCreateEconomy(target.id, interaction.guild!.id);

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`💰 ${target.username}'s Balance`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "👛 Wallet", value: `🪙 **${eco.wallet.toLocaleString()}** coins`, inline: true },
        { name: "🏦 Bank", value: `🪙 **${eco.bank.toLocaleString()}** coins`, inline: true },
        { name: "💎 Net Worth", value: `🪙 **${(eco.wallet + eco.bank).toLocaleString()}** coins`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Economy System • Use /daily to earn coins" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
