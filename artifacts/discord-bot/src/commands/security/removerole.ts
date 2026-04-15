import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("removerole")
    .setDescription("➖ Remove a role from a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((opt) => opt.setName("user").setDescription("Target user").setRequired(true))
    .addRoleOption((opt) => opt.setName("role").setDescription("Role to remove").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;
    const role = interaction.options.getRole("role", true);
    const reason = interaction.options.getString("reason") || "No reason";
    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });

    try {
      await target.roles.remove(role.id, reason);
      const embed = new EmbedBuilder()
        .setColor(0xff6600)
        .setTitle("➖ Role Removed")
        .addFields(
          { name: "👤 User", value: `${target.user.tag}`, inline: true },
          { name: "🎭 Role", value: `${role}`, inline: true },
          { name: "📋 Reason", value: reason, inline: false },
        )
        .setFooter({ text: "RYZENX™ Security" }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Could not remove role. Check role hierarchy.", ephemeral: true });
    }
  },
};
