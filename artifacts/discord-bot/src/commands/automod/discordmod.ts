import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  AutoModerationRuleEventType,
  AutoModerationRuleTriggerType,
  AutoModerationActionType,
  AutoModerationRuleKeywordPresetType,
  TextChannel,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("discordmod")
    .setDescription("🛡️ Manage Discord's native AutoMod rules (AI-powered)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("setup").setDescription("🚀 Auto-create all recommended Discord AutoMod rules")
        .addChannelOption((opt) =>
          opt.setName("alertchannel").setDescription("Channel to send AutoMod alerts").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("📋 List all active Discord AutoMod rules in this server")
    )
    .addSubcommand((sub) =>
      sub.setName("disable").setDescription("❌ Disable all Discord AutoMod rules")
    )
    .addSubcommand((sub) =>
      sub.setName("profanity").setDescription("🔤 Toggle profanity/hate speech/slur filter")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt.setName("alertchannel").setDescription("Alert channel").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("spam").setDescription("📨 Toggle Discord native spam filter")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
        .addChannelOption((opt) =>
          opt.setName("alertchannel").setDescription("Alert channel").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("mentions").setDescription("🏷️ Toggle mass mention spam filter")
        .addBooleanOption((opt) =>
          opt.setName("enabled").setDescription("Enable or disable").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt.setName("limit").setDescription("Max mentions per message (default: 5)").setMinValue(1).setMaxValue(50)
        )
        .addChannelOption((opt) =>
          opt.setName("alertchannel").setDescription("Alert channel").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("keywords").setDescription("🔑 Add a custom keyword blocking rule")
        .addStringOption((opt) =>
          opt.setName("words").setDescription("Comma-separated keywords to block").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Rule name").setRequired(false)
        )
        .addChannelOption((opt) =>
          opt.setName("alertchannel").setDescription("Alert channel").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("delete").setDescription("🗑️ Delete a specific AutoMod rule by ID")
        .addStringOption((opt) =>
          opt.setName("ruleid").setDescription("Rule ID to delete").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const alertChannel = interaction.options.getChannel("alertchannel") as TextChannel | null;

    const makeActions = (alertCh: TextChannel | null) => {
      const actions: any[] = [{ type: AutoModerationActionType.BlockMessage }];
      if (alertCh) {
        actions.push({ type: AutoModerationActionType.SendAlertMessage, metadata: { channelId: alertCh.id } });
      }
      actions.push({ type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 60 } });
      return actions;
    };

    if (sub === "setup") {
      try {
        const existingRules = await interaction.guild.autoModerationRules.fetch();
        const existingNames = new Set(existingRules.map((r) => r.name));
        const created: string[] = [];
        const actions = makeActions(alertChannel);

        if (!existingNames.has("RYZENX™ — Profanity Filter")) {
          await interaction.guild.autoModerationRules.create({
            name: "RYZENX™ — Profanity Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
              presets: [
                AutoModerationRuleKeywordPresetType.Profanity,
                AutoModerationRuleKeywordPresetType.SexualContent,
                AutoModerationRuleKeywordPresetType.Slurs,
              ],
            },
            actions,
            enabled: true,
          });
          created.push("🔤 Profanity + Slurs + Sexual Content");
        }

        if (!existingNames.has("RYZENX™ — Mention Spam")) {
          await interaction.guild.autoModerationRules.create({
            name: "RYZENX™ — Mention Spam",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: { mentionTotalLimit: 5, mentionRaidProtectionEnabled: true },
            actions,
            enabled: true,
          });
          created.push("🏷️ Mass Mention Spam");
        }

        if (!existingNames.has("RYZENX™ — Spam Filter")) {
          await interaction.guild.autoModerationRules.create({
            name: "RYZENX™ — Spam Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Spam,
            actions: [{ type: AutoModerationActionType.BlockMessage }],
            enabled: true,
          });
          created.push("📨 Spam Detection");
        }

        if (created.length === 0) {
          return interaction.editReply({ content: "✅ All RYZENX™ AutoMod rules are already set up!" });
        }

        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setAuthor({ name: "RYZENX™ Discord AutoMod Setup", iconURL: interaction.client.user?.displayAvatarURL() })
          .setTitle("🛡️ Discord AutoMod Rules Created!")
          .setDescription(`Successfully created **${created.length}** Discord native AutoMod rule${created.length > 1 ? "s" : ""}:`)
          .addFields({ name: "✅ Rules Created", value: created.map((r) => `• ${r}`).join("\n") })
          .addFields({ name: "📡 Alert Channel", value: alertChannel ? `${alertChannel}` : "None configured" })
          .setFooter({ text: "RYZENX™ • These rules are enforced by Discord itself — no bot needed online" })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error setting up rules: ${e.message}` });
      }
    }

    if (sub === "list") {
      try {
        const rules = await interaction.guild.autoModerationRules.fetch();
        if (!rules.size) {
          return interaction.editReply({ content: "📭 No AutoMod rules found in this server." });
        }

        const triggerNames: Record<number, string> = {
          [AutoModerationRuleTriggerType.Keyword]: "Custom Keywords",
          [AutoModerationRuleTriggerType.Spam]: "Spam Detection",
          [AutoModerationRuleTriggerType.KeywordPreset]: "Preset (Profanity/Slurs/Sexual)",
          [AutoModerationRuleTriggerType.MentionSpam]: "Mention Spam",
        };

        const lines = rules.map((r) => {
          const trigger = triggerNames[r.triggerType] || `Type ${r.triggerType}`;
          const status = r.enabled ? "✅" : "❌";
          return `${status} **${r.name}**\n   📋 Trigger: ${trigger} • 🆔 \`${r.id}\``;
        });

        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() ?? undefined })
          .setTitle("🛡️ Discord AutoMod Rules")
          .setDescription(lines.join("\n\n"))
          .setFooter({ text: `RYZENX™ • ${rules.size} rule${rules.size > 1 ? "s" : ""} active` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error fetching rules: ${e.message}` });
      }
    }

    if (sub === "disable") {
      try {
        const rules = await interaction.guild.autoModerationRules.fetch();
        let count = 0;
        for (const [, rule] of rules) {
          await rule.setEnabled(false).catch(() => {});
          count++;
        }
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xff4444).setDescription(`❌ Disabled **${count}** AutoMod rule${count > 1 ? "s" : ""}.`)],
        });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (sub === "profanity") {
      const enabled = interaction.options.getBoolean("enabled", true);
      const actions = makeActions(alertChannel);
      try {
        const rules = await interaction.guild.autoModerationRules.fetch();
        const existing = rules.find((r) => r.triggerType === AutoModerationRuleTriggerType.KeywordPreset);
        if (existing) {
          await existing.setEnabled(enabled);
          return interaction.editReply({ content: `${enabled ? "✅ Enabled" : "❌ Disabled"} profanity/slur filter.` });
        }
        if (enabled) {
          await interaction.guild.autoModerationRules.create({
            name: "RYZENX™ — Profanity Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.KeywordPreset,
            triggerMetadata: {
              presets: [
                AutoModerationRuleKeywordPresetType.Profanity,
                AutoModerationRuleKeywordPresetType.SexualContent,
                AutoModerationRuleKeywordPresetType.Slurs,
              ],
            },
            actions,
            enabled: true,
          });
          return interaction.editReply({ content: "✅ Profanity/slur filter created and enabled." });
        }
        return interaction.editReply({ content: "No profanity filter exists to disable." });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (sub === "spam") {
      const enabled = interaction.options.getBoolean("enabled", true);
      try {
        const rules = await interaction.guild.autoModerationRules.fetch();
        const existing = rules.find((r) => r.triggerType === AutoModerationRuleTriggerType.Spam);
        if (existing) {
          await existing.setEnabled(enabled);
          return interaction.editReply({ content: `${enabled ? "✅ Enabled" : "❌ Disabled"} spam filter.` });
        }
        if (enabled) {
          await interaction.guild.autoModerationRules.create({
            name: "RYZENX™ — Spam Filter",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Spam,
            actions: [{ type: AutoModerationActionType.BlockMessage }],
            enabled: true,
          });
          return interaction.editReply({ content: "✅ Spam filter created and enabled." });
        }
        return interaction.editReply({ content: "No spam filter exists to disable." });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (sub === "mentions") {
      const enabled = interaction.options.getBoolean("enabled", true);
      const limit = interaction.options.getInteger("limit") || 5;
      const actions = makeActions(alertChannel);
      try {
        const rules = await interaction.guild.autoModerationRules.fetch();
        const existing = rules.find((r) => r.triggerType === AutoModerationRuleTriggerType.MentionSpam);
        if (existing) {
          await existing.setEnabled(enabled);
          return interaction.editReply({ content: `${enabled ? "✅ Enabled" : "❌ Disabled"} mention spam filter.` });
        }
        if (enabled) {
          await interaction.guild.autoModerationRules.create({
            name: "RYZENX™ — Mention Spam",
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: { mentionTotalLimit: limit, mentionRaidProtectionEnabled: true },
            actions,
            enabled: true,
          });
          return interaction.editReply({ content: `✅ Mention spam filter enabled (limit: ${limit}).` });
        }
        return interaction.editReply({ content: "No mention spam filter exists to disable." });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (sub === "keywords") {
      const wordsRaw = interaction.options.getString("words", true);
      const ruleName = interaction.options.getString("name") || "RYZENX™ — Custom Keywords";
      const words = wordsRaw.split(",").map((w) => w.trim().toLowerCase()).filter(Boolean);
      const actions = makeActions(alertChannel);
      try {
        await interaction.guild.autoModerationRules.create({
          name: ruleName,
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: { keywordFilter: words },
          actions,
          enabled: true,
        });
        const embed = new EmbedBuilder()
          .setColor(0x00ff88)
          .setTitle("🔑 Custom Keyword Rule Created")
          .addFields(
            { name: "📋 Rule Name", value: ruleName, inline: true },
            { name: "🔤 Keywords", value: words.map((w) => `\`${w}\``).join(", "), inline: false },
            { name: "📡 Alert Channel", value: alertChannel ? `${alertChannel}` : "None" , inline: true },
          )
          .setFooter({ text: "RYZENX™ AutoMod" })
          .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    }

    if (sub === "delete") {
      const ruleId = interaction.options.getString("ruleid", true);
      try {
        await interaction.guild.autoModerationRules.delete(ruleId);
        await interaction.editReply({ content: `✅ AutoMod rule \`${ruleId}\` deleted.` });
      } catch (e: any) {
        await interaction.editReply({ content: `❌ Error: ${e.message}` });
      }
    }
  },
};
