import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("base64")
    .setDescription("🔐 Encode or decode Base64 text")
    .addStringOption((opt) =>
      opt.setName("action").setDescription("Encode or Decode").setRequired(true)
        .addChoices({ name: "🔒 Encode", value: "encode" }, { name: "🔓 Decode", value: "decode" })
    )
    .addStringOption((opt) => opt.setName("text").setDescription("Text to encode/decode").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const action = interaction.options.getString("action", true);
    const text = interaction.options.getString("text", true);

    let result = "";
    try {
      result = action === "encode" ? Buffer.from(text).toString("base64") : Buffer.from(text, "base64").toString("utf-8");
    } catch {
      return interaction.reply({ content: "❌ Invalid input for decoding.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🔐 Base64 ${action === "encode" ? "Encoded" : "Decoded"}`)
      .addFields(
        { name: "Input", value: `\`\`\`${text.substring(0, 500)}\`\`\``, inline: false },
        { name: "Output", value: `\`\`\`${result.substring(0, 500)}\`\`\``, inline: false },
      )
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
