import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, TextChannel, ChannelType,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("lockserver")
    .setDescription("🔒 Lock or unlock ALL text channels in the server (emergency use)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("lock").setDescription("🔒 Lock all text channels")
        .addStringOption((opt) => opt.setName("reason").setDescription("Reason for lockdown"))
    )
    .addSubcommand((sub) =>
      sub.setName("unlock").setDescription("🔓 Unlock all text channels")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;
    const reason = interaction.options.getString("reason") || "Emergency lockdown";

    const channels = guild.channels.cache.filter(
      (c) => c.type === ChannelType.GuildText && c.permissionsFor(guild.roles.everyone)?.has(PermissionFlagsBits.SendMessages)
    ) as any;

    let affected = 0;
    const errors: string[] = [];

    for (const [, channel] of channels) {
      try {
        if (sub === "lock") {
          await (channel as TextChannel).permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
          });
        } else {
          await (channel as TextChannel).permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: null,
            AddReactions: null,
          });
        }
        affected++;
      } catch {
        errors.push(`<#${channel.id}>`);
      }
    }

    if (sub === "lock") {
      await (interaction.channel as TextChannel).send({
        embeds: [new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🔒 SERVER LOCKED DOWN")
          .setDescription(`The server has been locked by **${interaction.user.tag}**.\n\n**Reason:** ${reason}`)
          .addFields({ name: "ℹ️ Info", value: "All channels are locked. Please wait for further instructions." })
          .setFooter({ text: "RYZENX™ Security System" })
          .setTimestamp()],
      }).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(sub === "lock" ? 0xff0000 : 0x00ff88)
      .setTitle(sub === "lock" ? "🔒 Server Locked!" : "🔓 Server Unlocked!")
      .setDescription(
        sub === "lock"
          ? `Locked **${affected}** channel${affected !== 1 ? "s" : ""}.\n**Reason:** ${reason}`
          : `Unlocked **${affected}** channel${affected !== 1 ? "s" : ""}.`
      )
      .addFields(
        { name: "✅ Affected", value: `${affected}`, inline: true },
        { name: "❌ Errors", value: errors.length ? errors.slice(0, 5).join(", ") : "None", inline: true },
        { name: "👮 By", value: interaction.user.tag, inline: true },
      )
      .setFooter({ text: "RYZENX™ Security System" })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
