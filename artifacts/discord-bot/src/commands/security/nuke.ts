import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("💣 Delete and recreate a channel (clears all messages)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) => opt.setName("channel").setDescription("Channel to nuke (defaults to current)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;
    if (!target) return interaction.reply({ content: "❌ Invalid channel.", ephemeral: true });

    await interaction.reply({ content: "💣 Nuking channel...", ephemeral: true });

    try {
      const position = target.position;
      const parent = target.parent;
      const name = target.name;
      const topic = target.topic || undefined;

      const newChannel = await target.clone({ name, topic, parent: parent || undefined });
      await newChannel.setPosition(position);
      await target.delete();

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("💣 CHANNEL NUKED")
        .setDescription("This channel has been nuked and recreated! All previous messages are gone.")
        .setImage("https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif")
        .setFooter({ text: `Nuked by ${interaction.user.tag} • RYZENX™` })
        .setTimestamp();

      await newChannel.send({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: "❌ Failed to nuke channel." });
    }
  },
};
