import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("✏️ Change a member's nickname")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((opt) => opt.setName("user").setDescription("User to nickname").setRequired(true))
    .addStringOption((opt) => opt.setName("nickname").setDescription("New nickname (leave empty to reset)").setMaxLength(32)),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember("user") as GuildMember;
    const nickname = interaction.options.getString("nickname");
    if (!target) return interaction.reply({ content: "❌ User not found in server.", ephemeral: true });

    try {
      const old = target.nickname || target.user.username;
      await target.setNickname(nickname, `Changed by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("✏️ Nickname Changed")
        .addFields(
          { name: "👤 User", value: `${target.user.tag}`, inline: true },
          { name: "📛 Old Nick", value: old, inline: true },
          { name: "📛 New Nick", value: nickname || target.user.username, inline: true },
        )
        .setThumbnail(target.user.displayAvatarURL())
        .setFooter({ text: "RYZENX™ Security" }).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: "❌ Could not change nickname. Check my permissions.", ephemeral: true });
    }
  },
};
