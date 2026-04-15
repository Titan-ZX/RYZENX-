import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { pool } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("👤 View a user's server profile")
    .addUserOption((opt) => opt.setName("user").setDescription("User to view")),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild!.members.cache.get(target.id);
    const guildId = interaction.guild!.id;

    const [profileRes, ecoRes, xpRes] = await Promise.all([
      pool.query("SELECT * FROM user_profiles WHERE user_id = $1 AND guild_id = $2", [target.id, guildId]),
      pool.query("SELECT wallet, bank FROM economy WHERE user_id = $1 AND guild_id = $2", [target.id, guildId]),
      pool.query("SELECT xp, level FROM user_levels WHERE user_id = $1 AND guild_id = $2", [target.id, guildId]),
    ]);

    const profile = profileRes.rows[0] || {};
    const eco = ecoRes.rows[0] || { wallet: 0, bank: 0 };
    const xp = xpRes.rows[0] || { xp: 0, level: 0 };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`👤 ${target.username}'s Profile`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "📝 Bio", value: profile.bio || "*No bio set — use `/bio` to add one!*", inline: false },
        { name: "⚡ Level", value: `${xp.level}`, inline: true },
        { name: "✨ XP", value: `${xp.xp.toLocaleString()}`, inline: true },
        { name: "💰 Wallet", value: `🪙 ${eco.wallet.toLocaleString()}`, inline: true },
        { name: "🏦 Bank", value: `🪙 ${eco.bank.toLocaleString()}`, inline: true },
        { name: "📅 Joined Server", value: member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : "Unknown", inline: true },
        { name: "📆 Discord Since", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: "RYZENX™ Community" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
