import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("addrole")
    .setDescription("➕ Add a role to a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((opt) => opt.setName("user").setDescription("Target user").setRequired(true))
    .addRoleOption((opt) => opt.setName("role").setDescription("Role to add").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;
    const role = interaction.options.getRole("role", true);
    const reason = interaction.options.getString("reason") || "No reason";
    if (!target) return interaction.reply({ content: "❌ User not found.", ephemeral: true });

    try {
      await target.roles.add(role.id, reason);
      const embed = new EmbedBuilder()
        .setColor(role.color || 0x00ff88)
        .setTitle("➕ Role Added")
        .addFields(
          { name: "👤 User", value: `${target.user.tag}`, inline: true },
          { name: "🎭 Role", value: `${role}`, inline: true },
          { name: "📋 Reason", value: reason, inline: false },
        )
        .setFooter({ text: "RYZENX™ Security" }).setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Could not add role. Check role hierarchy.", ephemeral: true });
    }
  },
};
