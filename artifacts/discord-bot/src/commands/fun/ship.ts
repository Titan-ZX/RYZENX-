import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("💕 Check the compatibility between two users!")
    .addUserOption((opt) => opt.setName("user1").setDescription("First person").setRequired(true))
    .addUserOption((opt) => opt.setName("user2").setDescription("Second person (leave empty for yourself)").setRequired(false)),

  async execute(interaction: ChatInputCommandInteraction) {
    const u1 = interaction.options.getUser("user1", true);
    const u2 = interaction.options.getUser("user2") || interaction.user;

    const seed = (parseInt(u1.id) + parseInt(u2.id)) % 100;
    const score = Math.abs(seed);

    let result = "";
    let color = 0;
    let emoji = "";

    if (score >= 90) { result = "SOULMATES! ❤️‍🔥 Made for each other!"; color = 0xff0000; emoji = "💞"; }
    else if (score >= 75) { result = "Very compatible! 💕 This could be something special!"; color = 0xff6699; emoji = "💕"; }
    else if (score >= 60) { result = "Good match! 💖 Worth exploring!"; color = 0xff99cc; emoji = "💖"; }
    else if (score >= 45) { result = "Maybe? 💛 Could work with some effort."; color = 0xffff00; emoji = "💛"; }
    else if (score >= 30) { result = "Meh 😐 It's complicated."; color = 0xff9900; emoji = "🧡"; }
    else if (score >= 15) { result = "Unlikely... 😬 Better as friends."; color = 0x888888; emoji = "💔"; }
    else { result = "Disaster! 💥 Run for the hills!"; color = 0xff4444; emoji = "💥"; }

    const bar = "❤️".repeat(Math.floor(score / 10)) + "🖤".repeat(10 - Math.floor(score / 10));

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${emoji} Compatibility Test`)
      .setDescription(`**${u1.username}** 💞 **${u2.username}**`)
      .addFields(
        { name: "💯 Score", value: `**${score}%**`, inline: true },
        { name: "❤️ Status", value: result, inline: true },
        { name: "❤️ Love Meter", value: bar, inline: false },
      )
      .setFooter({ text: "RYZENX™ Ship System • Purely for fun!" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
