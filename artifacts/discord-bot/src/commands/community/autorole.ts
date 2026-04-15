import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { updateGuildSettings, getGuildSettings } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Configure auto-role for new members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Set a role to give to new members")
        .addRoleOption((opt) => opt.setName("role").setDescription("Role to assign").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable auto-role")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Check current auto-role setting")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const role = interaction.options.getRole("role", true);
      await updateGuildSettings(interaction.guild!.id, { autorole: role.id });
      return interaction.reply({ content: `✅ Auto-role set to ${role}! New members will receive it automatically.`, ephemeral: true });
    }

    if (sub === "disable") {
      await updateGuildSettings(interaction.guild!.id, { autorole: null });
      return interaction.reply({ content: "✅ Auto-role has been disabled.", ephemeral: true });
    }

    if (sub === "status") {
      const settings = await getGuildSettings(interaction.guild!.id);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎭 Auto-Role Status")
        .addFields({ name: "Current Auto-Role", value: settings.autorole ? `<@&${settings.autorole}>` : "Not set" })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
