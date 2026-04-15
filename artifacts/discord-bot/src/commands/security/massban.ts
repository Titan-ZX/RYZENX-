import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("massban")
    .setDescription("⚡ Mass ban multiple users by IDs (space separated)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((opt) => opt.setName("ids").setDescription("User IDs separated by spaces").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Reason for mass ban")),

  async execute(interaction: ChatInputCommandInteraction) {
    const ids = interaction.options.getString("ids", true).split(/\s+/).filter((id) => /^\d+$/.test(id));
    const reason = interaction.options.getString("reason") || "Mass ban by moderator";
    if (!ids.length) return interaction.reply({ content: "❌ No valid user IDs provided.", ephemeral: true });

    await interaction.deferReply();
    let success = 0, failed = 0;

    for (const id of ids) {
      try {
        await interaction.guild!.members.ban(id, { reason, deleteMessageSeconds: 86400 });
        success++;
      } catch { failed++; }
    }

    const embed = new EmbedBuilder()
      .setColor(success > 0 ? 0xff0000 : 0xff9900)
      .setTitle("⚡ Mass Ban Complete")
      .addFields(
        { name: "✅ Banned", value: `${success} users`, inline: true },
        { name: "❌ Failed", value: `${failed} users`, inline: true },
        { name: "📋 Reason", value: reason, inline: false },
        { name: "👮 Moderator", value: interaction.user.tag, inline: true },
      )
      .setFooter({ text: "RYZENX™ Security" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
