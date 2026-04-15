import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("listroles")
    .setDescription("📋 List all roles in the server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const roles = interaction.guild!.roles.cache.sort((a, b) => b.position - a.position).filter((r) => r.id !== interaction.guild!.id);
    const chunks: string[] = [];
    let current = "";
    for (const [, role] of roles) {
      const line = `${role} (${role.members.size} members)\n`;
      if (current.length + line.length > 1024) { chunks.push(current); current = ""; }
      current += line;
    }
    if (current) chunks.push(current);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📋 Server Roles (${roles.size})`)
      .setDescription(chunks[0] || "No roles found")
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
