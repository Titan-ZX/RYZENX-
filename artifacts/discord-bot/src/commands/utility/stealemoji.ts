import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stealemoji")
    .setDescription("😎 Steal an emoji from another server and add it here")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
    .addStringOption((opt) => opt.setName("emoji").setDescription("The emoji to steal").setRequired(true))
    .addStringOption((opt) => opt.setName("name").setDescription("Custom name for the emoji")),

  async execute(interaction: ChatInputCommandInteraction) {
    const emojiStr = interaction.options.getString("emoji", true);
    const name = interaction.options.getString("name");

    const match = emojiStr.match(/<a?:(\w+):(\d+)>/);
    if (!match) return interaction.reply({ content: "❌ Please provide a valid custom emoji (not a default one).", ephemeral: true });

    const [, emojiName, emojiId] = match;
    const animated = emojiStr.startsWith("<a:");
    const ext = animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;
    const finalName = name || emojiName;

    try {
      const emoji = await interaction.guild!.emojis.create({ attachment: url, name: finalName });
      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("😎 Emoji Stolen!")
        .setDescription(`${emoji} has been added as \`:${finalName}:\`!`)
        .setThumbnail(url)
        .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Failed to add emoji. Server may be at the limit or I lack permissions.", ephemeral: true });
    }
  },
};
