import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) => opt.setName("amount").setDescription("Number of messages to delete (1-100)").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((opt) => opt.setName("user").setDescription("Only delete messages from this user")),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger("amount", true);
    const targetUser = interaction.options.getUser("user");
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await channel.messages.fetch({ limit: amount });
      if (targetUser) {
        messages = messages.filter((m) => m.author.id === targetUser.id);
      }
      const deleted = await channel.bulkDelete(messages, true);
      await interaction.editReply(`✅ Deleted **${deleted.size}** message(s).`);
    } catch {
      await interaction.editReply("❌ Failed to delete messages. Messages older than 14 days cannot be bulk deleted.");
    }
  },
};
