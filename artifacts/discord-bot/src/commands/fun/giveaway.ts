import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Giveaway management")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a giveaway")
        .addStringOption((opt) => opt.setName("prize").setDescription("Prize").setRequired(true))
        .addIntegerOption((opt) => opt.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1))
        .addIntegerOption((opt) => opt.setName("winners").setDescription("Number of winners").setMinValue(1).setMaxValue(20))
        .addChannelOption((opt) => opt.setName("channel").setDescription("Channel for giveaway"))
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End a giveaway early")
        .addStringOption((opt) => opt.setName("message_id").setDescription("Giveaway message ID").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const prize = interaction.options.getString("prize", true);
      const minutes = interaction.options.getInteger("minutes", true);
      const winners = interaction.options.getInteger("winners") || 1;
      const channel = (interaction.options.getChannel("channel") || interaction.channel) as TextChannel;

      const endsAt = new Date(Date.now() + minutes * 60 * 1000);

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle("🎉 GIVEAWAY!")
        .setDescription(`**Prize:** ${prize}\n\nReact with 🎉 to enter!\n\n**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n**Winners:** ${winners}`)
        .setFooter({ text: `Hosted by ${interaction.user.tag}` })
        .setTimestamp(endsAt);

      const msg = await channel.send({ embeds: [embed] });
      await msg.react("🎉");

      await pool.query(
        "INSERT INTO giveaways (guild_id, channel_id, message_id, host_id, prize, winners, ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [interaction.guild!.id, channel.id, msg.id, interaction.user.id, prize, winners, endsAt]
      );

      await interaction.reply({ content: `✅ Giveaway started in ${channel}!`, ephemeral: true });
    }

    if (sub === "end") {
      const messageId = interaction.options.getString("message_id", true);
      const result = await pool.query(
        "SELECT * FROM giveaways WHERE message_id = $1 AND guild_id = $2 AND ended = false",
        [messageId, interaction.guild!.id]
      );

      if (!result.rows.length) {
        return interaction.reply({ content: "❌ Giveaway not found.", ephemeral: true });
      }

      const giveaway = result.rows[0];
      const channel = interaction.guild!.channels.cache.get(giveaway.channel_id) as TextChannel;

      try {
        const msg = await channel.messages.fetch(giveaway.message_id);
        const reaction = msg.reactions.cache.get("🎉");
        const users = await reaction?.users.fetch();
        const eligible = users?.filter((u) => !u.bot).map((u) => u) || [];

        const selectedWinners: string[] = [];
        const pool2 = [...eligible];
        for (let i = 0; i < Math.min(giveaway.winners, pool2.length); i++) {
          const idx = Math.floor(Math.random() * pool2.length);
          selectedWinners.push(`<@${pool2[idx].id}>`);
          pool2.splice(idx, 1);
        }

        const winnerText = selectedWinners.length > 0 ? selectedWinners.join(", ") : "No eligible participants";

        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xffd700)
              .setTitle("🎉 Giveaway Ended!")
              .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winnerText}`)
              .setTimestamp(),
          ],
        });

        await pool.query("UPDATE giveaways SET ended = true WHERE message_id = $1", [messageId]);
        await interaction.reply({ content: `✅ Giveaway ended! Winners: ${winnerText}`, ephemeral: true });
      } catch {
        await interaction.reply({ content: "❌ Failed to end giveaway.", ephemeral: true });
      }
    }
  },
};
