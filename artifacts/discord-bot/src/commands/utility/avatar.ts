import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Get a user's avatar")
    .addUserOption((opt) => opt.setName("user").setDescription("User to get avatar for")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild?.members.cache.get(target.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${target.username}'s Avatar`)
      .setImage(target.displayAvatarURL({ size: 1024 }))
      .addFields({ name: "Links", value: `[PNG](${target.displayAvatarURL({ extension: "png", size: 1024 })}) | [WebP](${target.displayAvatarURL({ extension: "webp", size: 1024 })}) | [JPG](${target.displayAvatarURL({ extension: "jpg", size: 1024 })})` })
      .setTimestamp();

    if (member?.avatar) {
      embed.addFields({ name: "Server Avatar", value: `[PNG](${member.displayAvatarURL({ extension: "png", size: 1024 })})` });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
