import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";
import { getOrCreateEconomy } from "../../handlers/economy";

const COOLDOWN_MS = 30 * 60 * 1000;
const robCooldowns = new Map<string, number>();

export default {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("🔫 Attempt to rob another user's wallet (risky!)")
    .addUserOption((opt) => opt.setName("user").setDescription("Who to rob").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user", true);

    if (target.id === interaction.user.id) return interaction.reply({ content: "❌ You can't rob yourself.", ephemeral: true });
    if (target.bot) return interaction.reply({ content: "❌ You can't rob bots.", ephemeral: true });

    const key = `${interaction.guild!.id}-${interaction.user.id}`;
    const lastRob = robCooldowns.get(key) || 0;
    if (Date.now() - lastRob < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRob)) / 60000);
      return interaction.reply({ content: `⏰ You're on a cooldown! Try again in **${remaining}m**.`, ephemeral: true });
    }

    const robberEco = await getOrCreateEconomy(interaction.user.id, interaction.guild!.id);
    const victimEco = await getOrCreateEconomy(target.id, interaction.guild!.id);

    if (victimEco.wallet < 100) {
      return interaction.reply({ content: `❌ **${target.username}** doesn't have enough coins to rob (min: 🪙 100).`, ephemeral: true });
    }

    robCooldowns.set(key, Date.now());

    const success = Math.random() < 0.45;

    if (success) {
      const stolen = Math.floor(victimEco.wallet * (0.1 + Math.random() * 0.3));
      await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [stolen, interaction.user.id, interaction.guild!.id]);
      await pool.query("UPDATE economy SET wallet = wallet - $1 WHERE user_id = $2 AND guild_id = $3", [stolen, target.id, interaction.guild!.id]);

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🔫 Successful Robbery!")
        .setDescription(`You successfully robbed **${target.username}** and stole **🪙 ${stolen.toLocaleString()} coins**!`)
        .addFields({ name: "👛 Your Wallet", value: `🪙 ${(robberEco.wallet + stolen).toLocaleString()}`, inline: true })
        .setFooter({ text: "RYZENX™ Economy • Crime pays... sometimes" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      const fine = Math.floor(robberEco.wallet * 0.2);
      const actualFine = Math.min(fine, robberEco.wallet);
      if (actualFine > 0) {
        await pool.query("UPDATE economy SET wallet = wallet - $1 WHERE user_id = $2 AND guild_id = $3", [actualFine, interaction.user.id, interaction.guild!.id]);
      }

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("🚔 Caught Red-Handed!")
        .setDescription(`You failed to rob **${target.username}** and got caught!\nYou paid **🪙 ${actualFine.toLocaleString()} coins** as a fine.`)
        .addFields({ name: "👛 Your Wallet", value: `🪙 ${(robberEco.wallet - actualFine).toLocaleString()}`, inline: true })
        .setFooter({ text: "RYZENX™ Economy • Crime doesn't always pay" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
