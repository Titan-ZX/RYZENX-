import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export default {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll")
    .addStringOption((opt) => opt.setName("question").setDescription("Poll question").setRequired(true))
    .addStringOption((opt) => opt.setName("option1").setDescription("Option 1").setRequired(true))
    .addStringOption((opt) => opt.setName("option2").setDescription("Option 2").setRequired(true))
    .addStringOption((opt) => opt.setName("option3").setDescription("Option 3"))
    .addStringOption((opt) => opt.setName("option4").setDescription("Option 4"))
    .addStringOption((opt) => opt.setName("option5").setDescription("Option 5")),

  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);
    const options: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const opt = interaction.options.getString(`option${i}`);
      if (opt) options.push(opt);
    }

    const description = options.map((o, i) => `${numberEmojis[i]} ${o}`).join("\n\n");

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("📊 " + question)
      .setDescription(description)
      .setFooter({ text: `Poll by ${interaction.user.tag}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < options.length; i++) {
      await msg.react(numberEmojis[i]);
    }
  },
};
