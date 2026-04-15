import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("lvlroles")
    .setDescription("⚡ Level-up role rewards")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("➕ Add a role reward for a level")
        .addIntegerOption((opt) => opt.setName("level").setDescription("Level required").setRequired(true).setMinValue(1))
        .addRoleOption((opt) => opt.setName("role").setDescription("Role to award").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("➖ Remove a level role")
        .addIntegerOption((opt) => opt.setName("level").setDescription("Level to remove role from").setRequired(true))
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("📋 List all level roles")),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild!.id;

    if (sub === "add") {
      const level = interaction.options.getInteger("level", true);
      const role = interaction.options.getRole("role", true);
      await pool.query(
        "INSERT INTO level_roles (guild_id, level, role_id) VALUES ($1, $2, $3) ON CONFLICT (guild_id, level) DO UPDATE SET role_id = $3",
        [guildId, level, role.id]
      );
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ Members reaching **Level ${level}** will now get ${role}!`)] });
    }

    if (sub === "remove") {
      const level = interaction.options.getInteger("level", true);
      await pool.query("DELETE FROM level_roles WHERE guild_id = $1 AND level = $2", [guildId, level]);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`🗑️ Level ${level} role reward removed.`)] });
    }

    if (sub === "list") {
      const result = await pool.query("SELECT level, role_id FROM level_roles WHERE guild_id = $1 ORDER BY level", [guildId]);
      if (!result.rows.length) return interaction.reply({ content: "📭 No level roles configured.", ephemeral: true });
      const lines = result.rows.map((r: any) => `**Level ${r.level}** → <@&${r.role_id}>`);
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setTitle("⚡ Level Role Rewards").setDescription(lines.join("\n"))] });
    }
  },
};
