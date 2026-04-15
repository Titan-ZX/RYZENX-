import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Manage reaction roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a reaction role to a message")
        .addStringOption((opt) => opt.setName("message_id").setDescription("The message ID").setRequired(true))
        .addStringOption((opt) => opt.setName("emoji").setDescription("The emoji to react with").setRequired(true))
        .addRoleOption((opt) => opt.setName("role").setDescription("The role to assign").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a reaction role from a message")
        .addStringOption((opt) => opt.setName("message_id").setDescription("The message ID").setRequired(true))
        .addStringOption((opt) => opt.setName("emoji").setDescription("The emoji").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all reaction roles in this server")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const messageId = interaction.options.getString("message_id", true);
      const emoji = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("role", true);

      await pool.query(
        "INSERT INTO reaction_roles (guild_id, message_id, emoji, role_id) VALUES ($1, $2, $3, $4) ON CONFLICT (message_id, emoji) DO UPDATE SET role_id = $4",
        [interaction.guild!.id, messageId, emoji, role.id]
      );

      return interaction.reply({ content: `✅ Reaction role added! ${emoji} → ${role} on message \`${messageId}\``, ephemeral: true });
    }

    if (sub === "remove") {
      const messageId = interaction.options.getString("message_id", true);
      const emoji = interaction.options.getString("emoji", true);
      await pool.query("DELETE FROM reaction_roles WHERE message_id = $1 AND emoji = $2", [messageId, emoji]);
      return interaction.reply({ content: "✅ Reaction role removed.", ephemeral: true });
    }

    if (sub === "list") {
      const result = await pool.query(
        "SELECT * FROM reaction_roles WHERE guild_id = $1",
        [interaction.guild!.id]
      );
      if (!result.rows.length) return interaction.reply({ content: "No reaction roles set up.", ephemeral: true });

      const lines = result.rows.map((r: any) => `${r.emoji} → <@&${r.role_id}> (msg: \`${r.message_id}\`)`);
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("🎭 Reaction Roles")
        .setDescription(lines.join("\n"))
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
