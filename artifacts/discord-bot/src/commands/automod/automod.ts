import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getGuildSettings, updateGuildSettings } from "../../database";

export default {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Configure automod settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("enable").setDescription("Enable automod")
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("Disable automod")
    )
    .addSubcommand((sub) =>
      sub.setName("status").setDescription("Show current automod settings")
    )
    .addSubcommandGroup((grp) =>
      grp
        .setName("wordfilter")
        .setDescription("Word filter management")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("Add a word to the filter")
            .addStringOption((opt) =>
              opt.setName("word").setDescription("Word to block").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("Remove a word from the filter")
            .addStringOption((opt) =>
              opt.setName("word").setDescription("Word to remove").setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("List all filtered words")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("linkfilter")
        .setDescription("Toggle link filter")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("antispam")
        .setDescription("Configure anti-spam")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("threshold")
            .setDescription("Messages per 3 seconds before action (default: 5)")
            .setMinValue(2)
            .setMaxValue(20)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("capslimit")
        .setDescription("Set caps percentage limit")
        .addIntegerOption((opt) =>
          opt
            .setName("percent")
            .setDescription("Max percentage of caps (default: 70)")
            .setRequired(true)
            .setMinValue(10)
            .setMaxValue(100)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("mentionlimit")
        .setDescription("Set max mentions per message")
        .addIntegerOption((opt) =>
          opt
            .setName("limit")
            .setDescription("Max mentions allowed (default: 5)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(50)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("antiraid")
        .setDescription("Configure anti-raid protection")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("logchannel")
        .setDescription("Set the automod log channel")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("Log channel").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    const settings = await getGuildSettings(interaction.guild.id);
    const sub = interaction.options.getSubcommand(false);
    const grp = interaction.options.getSubcommandGroup(false);

    if (grp === "wordfilter") {
      if (sub === "add") {
        const word = interaction.options.getString("word", true).toLowerCase();
        const filter: string[] = settings.word_filter || [];
        if (filter.includes(word)) {
          return interaction.reply({ content: `\`${word}\` is already in the filter.`, ephemeral: true });
        }
        filter.push(word);
        await updateGuildSettings(interaction.guild.id, { word_filter: filter });
        return interaction.reply({ content: `✅ Added \`${word}\` to the word filter.`, ephemeral: true });
      }
      if (sub === "remove") {
        const word = interaction.options.getString("word", true).toLowerCase();
        const filter: string[] = (settings.word_filter || []).filter((w: string) => w !== word);
        await updateGuildSettings(interaction.guild.id, { word_filter: filter });
        return interaction.reply({ content: `✅ Removed \`${word}\` from the filter.`, ephemeral: true });
      }
      if (sub === "list") {
        const filter: string[] = settings.word_filter || [];
        const embed = new EmbedBuilder()
          .setColor(0xff6600)
          .setTitle("🔤 Word Filter")
          .setDescription(filter.length ? filter.map((w) => `\`${w}\``).join(", ") : "No words in filter");
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    if (sub === "enable") {
      await updateGuildSettings(interaction.guild.id, { automod_enabled: true });
      return interaction.reply({ content: "✅ Automod has been **enabled**.", ephemeral: true });
    }

    if (sub === "disable") {
      await updateGuildSettings(interaction.guild.id, { automod_enabled: false });
      return interaction.reply({ content: "✅ Automod has been **disabled**.", ephemeral: true });
    }

    if (sub === "linkfilter") {
      const enabled = interaction.options.getBoolean("enabled", true);
      await updateGuildSettings(interaction.guild.id, { link_filter: enabled });
      return interaction.reply({ content: `✅ Link filter ${enabled ? "enabled" : "disabled"}.`, ephemeral: true });
    }

    if (sub === "antispam") {
      const enabled = interaction.options.getBoolean("enabled", true);
      const threshold = interaction.options.getInteger("threshold");
      const updates: any = { anti_spam: enabled };
      if (threshold) updates.spam_threshold = threshold;
      await updateGuildSettings(interaction.guild.id, updates);
      return interaction.reply({ content: `✅ Anti-spam ${enabled ? "enabled" : "disabled"}${threshold ? ` (threshold: ${threshold})` : ""}.`, ephemeral: true });
    }

    if (sub === "capslimit") {
      const percent = interaction.options.getInteger("percent", true);
      await updateGuildSettings(interaction.guild.id, { caps_limit: percent });
      return interaction.reply({ content: `✅ Caps limit set to **${percent}%**.`, ephemeral: true });
    }

    if (sub === "mentionlimit") {
      const limit = interaction.options.getInteger("limit", true);
      await updateGuildSettings(interaction.guild.id, { mention_limit: limit });
      return interaction.reply({ content: `✅ Mention limit set to **${limit}**.`, ephemeral: true });
    }

    if (sub === "antiraid") {
      const enabled = interaction.options.getBoolean("enabled", true);
      await updateGuildSettings(interaction.guild.id, { anti_raid: enabled });
      return interaction.reply({ content: `✅ Anti-raid ${enabled ? "enabled" : "disabled"}.`, ephemeral: true });
    }

    if (sub === "logchannel") {
      const channel = interaction.options.getChannel("channel", true);
      await updateGuildSettings(interaction.guild.id, { log_channel: channel.id });
      return interaction.reply({ content: `✅ Log channel set to ${channel}.`, ephemeral: true });
    }

    if (sub === "status") {
      const s = settings;
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("🛡️ Automod Status")
        .addFields(
          { name: "Enabled", value: s.automod_enabled ? "✅ Yes" : "❌ No", inline: true },
          { name: "Link Filter", value: s.link_filter ? "✅ Yes" : "❌ No", inline: true },
          { name: "Anti-Spam", value: s.anti_spam ? `✅ Yes (${s.spam_threshold} msgs/3s)` : "❌ No", inline: true },
          { name: "Caps Limit", value: `${s.caps_limit}%`, inline: true },
          { name: "Mention Limit", value: `${s.mention_limit}`, inline: true },
          { name: "Anti-Raid", value: s.anti_raid ? "✅ Yes" : "❌ No", inline: true },
          { name: "Word Filter", value: `${(s.word_filter || []).length} words`, inline: true },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
