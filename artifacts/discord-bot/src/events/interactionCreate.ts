import {
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { ExtendedClient } from "../types";
import { pool } from "../database";
import { HELP_CATEGORIES } from "../commands/utility/help";

export async function onInteractionCreate(client: ExtendedClient, interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error: any) {
      console.error(`[Commands] Error executing ${interaction.commandName}:`, error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ Error")
        .setDescription("An error occurred while executing this command.")
        .setTimestamp();
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "help_category") {
      const selected = interaction.values[0];
      const category = HELP_CATEGORIES[selected];
      if (!category) return;

      const embed = new EmbedBuilder()
        .setColor(category.color)
        .setTitle(`${category.emoji} ${category.name} Commands`)
        .setDescription(category.commands.map((c: any) => `\`/${c.name}\` — ${c.desc}`).join("\n"))
        .setFooter({ text: "RYZENX™ • Ultra-Advanced Bot System" })
        .setTimestamp();

      await interaction.update({ embeds: [embed] });
    }
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("giveaway_enter_")) {
      const giveawayId = interaction.customId.replace("giveaway_enter_", "");

      const gw = await pool.query(
        "SELECT * FROM giveaways WHERE id = $1 AND ended = false",
        [giveawayId]
      );
      if (!gw.rows.length) {
        return interaction.reply({ content: "❌ This giveaway has already ended.", ephemeral: true });
      }

      const already = await pool.query(
        "SELECT id FROM giveaway_entries WHERE giveaway_id = $1 AND user_id = $2",
        [giveawayId, interaction.user.id]
      );

      if (already.rows.length > 0) {
        return interaction.reply({ content: "⚠️ You have already entered this giveaway!", ephemeral: true });
      }

      await pool.query(
        "INSERT INTO giveaway_entries (giveaway_id, user_id) VALUES ($1, $2)",
        [giveawayId, interaction.user.id]
      );

      const countResult = await pool.query(
        "SELECT COUNT(*) FROM giveaway_entries WHERE giveaway_id = $1",
        [giveawayId]
      );
      const count = parseInt(countResult.rows[0].count);

      await interaction.reply({
        content: `🎉 You have entered the giveaway for **${gw.rows[0].prize}**! Total entries: **${count}**`,
        ephemeral: true,
      });
    }
    return;
  }
}
