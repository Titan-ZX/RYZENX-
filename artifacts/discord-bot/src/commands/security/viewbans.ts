import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("viewbans")
    .setDescription("📋 View all banned users in this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addIntegerOption((opt) => opt.setName("page").setDescription("Page number").setMinValue(1)),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    const perPage = 10;

    try {
      const bans = await interaction.guild!.bans.fetch();
      if (!bans.size) {
        return interaction.editReply({ content: "✅ This server has no banned users." });
      }

      const banArray = [...bans.values()];
      const totalPages = Math.ceil(banArray.length / perPage);
      const pageSlice = banArray.slice(page * perPage, (page + 1) * perPage);

      const lines = pageSlice.map((ban, i) => {
        const reason = ban.reason ? ban.reason.substring(0, 60) : "No reason provided";
        return `**${page * perPage + i + 1}.** ${ban.user.tag} \`${ban.user.id}\`\n   📋 ${reason}`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xff4444)
        .setAuthor({ name: interaction.guild!.name, iconURL: interaction.guild!.iconURL() ?? undefined })
        .setTitle(`🔨 Banned Users — ${bans.size} total`)
        .setDescription(lines.join("\n\n"))
        .setFooter({ text: `RYZENX™ Security • Page ${page + 1}/${totalPages}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({ content: "❌ Could not fetch ban list. Check bot permissions." });
    }
  },
};
