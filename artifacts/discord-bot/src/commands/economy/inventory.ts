import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("🎒 View your item inventory")
    .addUserOption((opt) => opt.setName("user").setDescription("View another user's inventory")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const items = await pool.query(
      "SELECT item_name, quantity FROM inventory WHERE user_id = $1 AND guild_id = $2 ORDER BY acquired_at DESC",
      [target.id, interaction.guild!.id]
    );

    const embed = new EmbedBuilder()
      .setColor(0x9966ff)
      .setTitle(`🎒 ${target.username}'s Inventory`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "RYZENX™ Economy" }).setTimestamp();

    if (!items.rows.length) {
      embed.setDescription("🫙 Empty! Buy items from `/shop view`.");
    } else {
      embed.setDescription(
        items.rows.map((i: any) => `• **${i.item_name}** × ${i.quantity}`).join("\n")
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
