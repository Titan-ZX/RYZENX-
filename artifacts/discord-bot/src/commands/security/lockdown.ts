import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, TextChannel,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("lockdown")
    .setDescription("🔒 Lock or unlock a specific channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub.setName("lock").setDescription("🔒 Lock a channel — no one can send messages")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to lock (defaults to current)"))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for lockdown"))
    )
    .addSubcommand((sub) =>
      sub.setName("unlock").setDescription("🔓 Unlock a previously locked channel")
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to unlock (defaults to current)"))
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for unlock"))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const channel = (interaction.options.getChannel("channel") ?? interaction.channel) as TextChannel;
    const reason = interaction.options.getString("reason") ?? (sub === "lock" ? "No reason provided" : "Unlocked by staff");

    if (sub === "lock") {
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false, AddReactions: false });
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🔒 Channel Locked")
          .setDescription(`${channel} has been **locked**.\n**Reason:** ${reason}`)
          .setFooter({ text: `By: ${interaction.user.tag} • RYZENX™` })
          .setTimestamp()],
      });
    }

    if (sub === "unlock") {
      await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null, AddReactions: null });
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle("🔓 Channel Unlocked")
          .setDescription(`${channel} has been **unlocked**.\n**Reason:** ${reason}`)
          .setFooter({ text: `By: ${interaction.user.tag} • RYZENX™` })
          .setTimestamp()],
      });
    }
  },
};
