import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("💬 Make the bot say something")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) => opt.setName("message").setDescription("Message to say").setRequired(true).setMaxLength(2000))
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to send to (default: current)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString("message", true);
    const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;

    try {
      await channel.send(message);
      await interaction.reply({ content: "✅ Message sent!", ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ Could not send message.", ephemeral: true });
    }
  },
};
