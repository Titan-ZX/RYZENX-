import { Interaction, EmbedBuilder } from "discord.js";
import { ExtendedClient } from "../types";

export async function onInteractionCreate(client: ExtendedClient, interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

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
}
