import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("bio")
    .setDescription("✏️ Set your profile bio")
    .addStringOption((opt) => opt.setName("text").setDescription("Your bio (leave empty to clear)").setMaxLength(300)),

  async execute(interaction: ChatInputCommandInteraction) {
    const bio = interaction.options.getString("text");
    await pool.query(
      "INSERT INTO user_profiles (user_id, guild_id, bio) VALUES ($1, $2, $3) ON CONFLICT (user_id, guild_id) DO UPDATE SET bio = $3",
      [interaction.user.id, interaction.guild!.id, bio || null]
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("✏️ Bio Updated!")
      .setDescription(bio ? `Your bio is now: *${bio}*` : "Your bio has been cleared.")
      .setFooter({ text: "RYZENX™ Community • View it with /profile" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
