import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { updateGuildSettings, getGuildSettings } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure welcome/goodbye messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("setup")
        .setDescription("Set welcome channel and message")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Welcome channel").setRequired(true))
        .addStringOption((opt) => opt.setName("message").setDescription("Welcome message (use {user}, {username}, {server}, {count})"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("goodbye")
        .setDescription("Set goodbye channel and message")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Goodbye channel").setRequired(true))
        .addStringOption((opt) => opt.setName("message").setDescription("Goodbye message (use {user}, {username}, {server})"))
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable welcome/goodbye messages")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("View current welcome settings")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message");
      const updates: any = { welcome_channel: channel.id };
      if (message) updates.welcome_message = message;
      await updateGuildSettings(interaction.guild!.id, updates);
      return interaction.reply({ content: `✅ Welcome messages set to ${channel}!`, ephemeral: true });
    }

    if (sub === "goodbye") {
      const channel = interaction.options.getChannel("channel", true);
      const message = interaction.options.getString("message");
      const updates: any = { goodbye_channel: channel.id };
      if (message) updates.goodbye_message = message;
      await updateGuildSettings(interaction.guild!.id, updates);
      return interaction.reply({ content: `✅ Goodbye messages set to ${channel}!`, ephemeral: true });
    }

    if (sub === "disable") {
      await updateGuildSettings(interaction.guild!.id, { welcome_channel: null, goodbye_channel: null });
      return interaction.reply({ content: "✅ Welcome/goodbye messages disabled.", ephemeral: true });
    }

    if (sub === "status") {
      const settings = await getGuildSettings(interaction.guild!.id);
      const embed = new EmbedBuilder()
        .setColor(0x00ff88)
        .setTitle("👋 Welcome Configuration")
        .addFields(
          { name: "Welcome Channel", value: settings.welcome_channel ? `<#${settings.welcome_channel}>` : "Not set", inline: true },
          { name: "Welcome Message", value: settings.welcome_message || "Default", inline: false },
          { name: "Goodbye Channel", value: settings.goodbye_channel ? `<#${settings.goodbye_channel}>` : "Not set", inline: true },
          { name: "Goodbye Message", value: settings.goodbye_message || "Default", inline: false },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
