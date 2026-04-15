import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, GuildMember } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dehoist")
    .setDescription("🔡 Remove hoisted names (starting with ! # $ etc.) from all members")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const members = await interaction.guild!.members.fetch();
    const hoistChars = /^[!#$%^&*(),.?":{}|<>\[\]\\@~`+\-=_]/;
    let count = 0;

    for (const [, member] of members) {
      if (member.manageable && hoistChars.test(member.displayName)) {
        try {
          await member.setNickname(`𝗨𝘀𝗲𝗿 ${member.user.username.substring(0, 20)}`);
          count++;
        } catch {}
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🔡 Dehoist Complete")
      .setDescription(`Removed hoisted characters from **${count}** member${count !== 1 ? "s" : ""}.`)
      .setFooter({ text: "RYZENX™ Security" }).setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
