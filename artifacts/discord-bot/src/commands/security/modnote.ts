import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("modnote")
    .setDescription("📝 Moderator notes system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("➕ Add a note to a user")
        .addUserOption((opt) => opt.setName("user").setDescription("User to note").setRequired(true))
        .addStringOption((opt) => opt.setName("note").setDescription("Note content").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("👁️ View notes for a user")
        .addUserOption((opt) => opt.setName("user").setDescription("User to view notes for").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("delete").setDescription("🗑️ Delete a note by ID")
        .addIntegerOption((opt) => opt.setName("id").setDescription("Note ID").setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const target = interaction.options.getUser("user", true);
      const note = interaction.options.getString("note", true);
      await pool.query(
        "INSERT INTO mod_notes (user_id, guild_id, moderator_id, note) VALUES ($1, $2, $3, $4)",
        [target.id, interaction.guild!.id, interaction.user.id, note]
      );
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`📝 Note added for **${target.tag}**`)], ephemeral: true });
    }

    if (sub === "view") {
      const target = interaction.options.getUser("user", true);
      const notes = await pool.query(
        "SELECT * FROM mod_notes WHERE user_id = $1 AND guild_id = $2 ORDER BY created_at DESC LIMIT 10",
        [target.id, interaction.guild!.id]
      );
      if (!notes.rows.length) return interaction.reply({ content: `📭 No notes for **${target.tag}**`, ephemeral: true });

      const lines = notes.rows.map((n: any) => `**[#${n.id}]** <@${n.moderator_id}>: ${n.note}\n*${new Date(n.created_at).toLocaleDateString()}*`);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2).setTitle(`📝 Notes for ${target.tag}`)
        .setDescription(lines.join("\n\n"))
        .setThumbnail(target.displayAvatarURL())
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "delete") {
      const id = interaction.options.getInteger("id", true);
      await pool.query("DELETE FROM mod_notes WHERE id = $1 AND guild_id = $2", [id, interaction.guild!.id]);
      return interaction.reply({ content: `🗑️ Note #${id} deleted.`, ephemeral: true });
    }
  },
};
