import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("🎂 Birthday system")
    .addSubcommand((sub) =>
      sub.setName("set").setDescription("🎂 Set your birthday")
        .addIntegerOption((opt) => opt.setName("day").setDescription("Day (1-31)").setRequired(true).setMinValue(1).setMaxValue(31))
        .addIntegerOption((opt) =>
          opt.setName("month").setDescription("Month (1-12)").setRequired(true).setMinValue(1).setMaxValue(12)
            .addChoices(
              { name: "January", value: 1 }, { name: "February", value: 2 }, { name: "March", value: 3 },
              { name: "April", value: 4 }, { name: "May", value: 5 }, { name: "June", value: 6 },
              { name: "July", value: 7 }, { name: "August", value: 8 }, { name: "September", value: 9 },
              { name: "October", value: 10 }, { name: "November", value: 11 }, { name: "December", value: 12 },
            )
        )
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("📋 Upcoming birthdays in this server"))
    .addSubcommand((sub) =>
      sub.setName("check").setDescription("🔍 Check someone's birthday")
        .addUserOption((opt) => opt.setName("user").setDescription("User to check"))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "set") {
      const day = interaction.options.getInteger("day", true);
      const month = interaction.options.getInteger("month", true);
      const birthday = `${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      await pool.query(
        "INSERT INTO birthdays (user_id, guild_id, birthday) VALUES ($1, $2, $3) ON CONFLICT (user_id, guild_id) DO UPDATE SET birthday = $3",
        [interaction.user.id, interaction.guild!.id, birthday]
      );

      const months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
      const embed = new EmbedBuilder()
        .setColor(0xff99cc)
        .setTitle("🎂 Birthday Saved!")
        .setDescription(`Your birthday is set to **${months[month]} ${day}**!`)
        .setFooter({ text: "RYZENX™ Community" }).setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "list") {
      const today = new Date();
      const currentMMDD = `${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
      const result = await pool.query(
        "SELECT user_id, birthday FROM birthdays WHERE guild_id = $1 ORDER BY CASE WHEN birthday >= $2 THEN 0 ELSE 1 END, birthday LIMIT 15",
        [interaction.guild!.id, currentMMDD]
      );

      if (!result.rows.length) return interaction.reply({ content: "📭 No birthdays registered yet!", ephemeral: true });

      const months = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const lines = result.rows.map((r: any) => {
        const [mm, dd] = r.birthday.split("-");
        return `• <@${r.user_id}> — **${months[parseInt(mm)]} ${parseInt(dd)}**`;
      });

      const embed = new EmbedBuilder()
        .setColor(0xff99cc)
        .setTitle(`🎂 Upcoming Birthdays`)
        .setDescription(lines.join("\n"))
        .setFooter({ text: "RYZENX™ Community" }).setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "check") {
      const target = interaction.options.getUser("user") || interaction.user;
      const result = await pool.query("SELECT birthday FROM birthdays WHERE user_id = $1 AND guild_id = $2", [target.id, interaction.guild!.id]);
      if (!result.rows.length) return interaction.reply({ content: `❌ **${target.username}** hasn't set their birthday.`, ephemeral: true });

      const [mm, dd] = result.rows[0].birthday.split("-");
      const months = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff99cc).setTitle("🎂 Birthday").setDescription(`**${target.username}**'s birthday is **${months[parseInt(mm)]} ${parseInt(dd)}**! 🎉`)] });
    }
  },
};
