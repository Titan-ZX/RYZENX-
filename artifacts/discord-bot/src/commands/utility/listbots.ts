import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("listbots")
    .setDescription("🤖 List all bots in the server"),

  async execute(interaction: ChatInputCommandInteraction) {
    const members = await interaction.guild!.members.fetch();
    const bots = members.filter((m) => m.user.bot);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🤖 Server Bots (${bots.size})`)
      .setDescription(bots.map((b) => `• **${b.user.username}** — ${b.user.id}`).join("\n").substring(0, 2000) || "No bots found")
      .setFooter({ text: "RYZENX™ Utility" }).setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
