import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { getGuildSettings, updateGuildSettings } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Submit a suggestion or configure suggestions")
    .addSubcommand((sub) =>
      sub
        .setName("submit")
        .setDescription("Submit a suggestion")
        .addStringOption((opt) => opt.setName("suggestion").setDescription("Your suggestion").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("setchannel")
        .setDescription("Set the suggestions channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Suggestions channel").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "setchannel") {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildSettings(interaction.guild!.id, { suggestion_channel: channel.id });
      return interaction.reply({ content: `✅ Suggestions channel set to ${channel}!`, ephemeral: true });
    }

    if (sub === "submit") {
      const suggestion = interaction.options.getString("suggestion", true);
      const settings = await getGuildSettings(interaction.guild!.id);

      if (!settings.suggestion_channel) {
        return interaction.reply({ content: "❌ Suggestions channel not configured. Ask an admin to set it up with `/suggest setchannel`.", ephemeral: true });
      }

      const channel = interaction.guild!.channels.cache.get(settings.suggestion_channel) as TextChannel;
      if (!channel) {
        return interaction.reply({ content: "❌ Suggestions channel not found.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("💡 New Suggestion")
        .setDescription(suggestion)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      const msg = await channel.send({ embeds: [embed] });
      await msg.react("👍");
      await msg.react("👎");

      await interaction.reply({ content: "✅ Your suggestion has been submitted!", ephemeral: true });
    }
  },
};
