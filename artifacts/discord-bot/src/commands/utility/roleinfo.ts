import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Role } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("🎭 Get information about a role")
    .addRoleOption((opt) => opt.setName("role").setDescription("Role to inspect").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role", true) as Role;
    const members = (await interaction.guild!.members.fetch()).filter((m) => m.roles.cache.has(role.id));

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x5865f2)
      .setTitle(`🎭 ${role.name}`)
      .addFields(
        { name: "🆔 ID", value: role.id, inline: true },
        { name: "🎨 Color", value: role.hexColor, inline: true },
        { name: "👥 Members", value: `${members.size}`, inline: true },
        { name: "📌 Hoisted", value: role.hoist ? "✅ Yes" : "❌ No", inline: true },
        { name: "🔔 Mentionable", value: role.mentionable ? "✅ Yes" : "❌ No", inline: true },
        { name: "🤖 Managed", value: role.managed ? "✅ Yes (Bot)" : "❌ No", inline: true },
        { name: "📋 Position", value: `${role.position}`, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
