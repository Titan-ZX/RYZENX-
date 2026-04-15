import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Client,
} from "discord.js";

export const HELP_CATEGORIES: Record<string, any> = {
  automod: {
    name: "Automod",
    emoji: "🛡️",
    color: 0xff6600,
    description: "AI-powered moderation filters",
    commands: [
      { name: "automod enable/disable", desc: "Toggle the automod system" },
      { name: "automod wordfilter", desc: "Add/remove/list filtered words" },
      { name: "automod linkfilter", desc: "Block links in messages" },
      { name: "automod antispam", desc: "Auto-timeout spammers" },
      { name: "automod capslimit", desc: "Set max caps percentage" },
      { name: "automod mentionlimit", desc: "Limit mention spam" },
      { name: "automod antiraid", desc: "Anti-raid protection" },
      { name: "automod logchannel", desc: "Set moderation log channel" },
      { name: "automod status", desc: "View all automod settings" },
    ],
  },
  security: {
    name: "Security",
    emoji: "🔒",
    color: 0xff0000,
    description: "Z+ server security & moderation",
    commands: [
      { name: "ban", desc: "Ban a user with optional message deletion" },
      { name: "kick", desc: "Kick a member from the server" },
      { name: "timeout", desc: "Timeout a member (1m - 28d)" },
      { name: "unmute", desc: "Remove a timeout from a member" },
      { name: "softban", desc: "Ban + unban to delete messages" },
      { name: "warn", desc: "Issue a warning (stored in DB)" },
      { name: "warnings", desc: "View a user's warnings" },
      { name: "clearwarnings", desc: "Clear all warnings for a user" },
      { name: "purge", desc: "Bulk delete messages (1-100)" },
      { name: "lockdown", desc: "Lock a channel for everyone" },
      { name: "unlock", desc: "Unlock a channel" },
      { name: "slowmode", desc: "Set slowmode (0 to disable)" },
    ],
  },
  fun: {
    name: "Fun",
    emoji: "🎉",
    color: 0xffd700,
    description: "Games, entertainment & fun",
    commands: [
      { name: "8ball", desc: "Ask the magic 8-ball a question" },
      { name: "roll", desc: "Roll dice (e.g. 2d6, d20, 3d8)" },
      { name: "coinflip", desc: "Flip a coin" },
      { name: "rps", desc: "Rock paper scissors vs bot" },
      { name: "joke", desc: "Random joke from API" },
      { name: "meme", desc: "Random meme from Reddit" },
      { name: "poll", desc: "Create a poll with reactions" },
      { name: "giveaway start", desc: "Start a giveaway with button entry" },
      { name: "giveaway end", desc: "End a giveaway and pick winners" },
    ],
  },
  utility: {
    name: "Utility",
    emoji: "🔧",
    color: 0x00aaff,
    description: "Server & user utilities",
    commands: [
      { name: "ping", desc: "Check bot & WebSocket latency" },
      { name: "serverinfo", desc: "Detailed server statistics" },
      { name: "userinfo", desc: "Detailed user information" },
      { name: "avatar", desc: "Get a user's avatar (all formats)" },
      { name: "remind", desc: "Set a timed reminder (10s, 5m, 2h, 1d)" },
      { name: "math", desc: "Evaluate a math expression" },
      { name: "botinfo", desc: "RYZENX™ system stats" },
      { name: "setprefix", desc: "Set a custom command prefix" },
      { name: "help", desc: "This help menu" },
    ],
  },
  community: {
    name: "Community",
    emoji: "👥",
    color: 0x00ff88,
    description: "Community & engagement tools",
    commands: [
      { name: "rank", desc: "View your XP rank & progress" },
      { name: "leaderboard", desc: "Top 10 XP leaderboard" },
      { name: "welcome setup", desc: "Set welcome channel & message" },
      { name: "welcome goodbye", desc: "Set goodbye channel & message" },
      { name: "suggest submit", desc: "Submit a suggestion" },
      { name: "suggest setchannel", desc: "Set suggestions channel" },
      { name: "autorole set", desc: "Give new members a role automatically" },
      { name: "reactionrole add", desc: "Add a reaction role to a message" },
    ],
  },
  economy: {
    name: "Economy",
    emoji: "💰",
    color: 0xffd700,
    description: "Earn coins, trade & grow",
    commands: [
      { name: "balance", desc: "View your coin balance" },
      { name: "daily", desc: "Claim daily coins (24h cooldown)" },
      { name: "work", desc: "Work for coins (1h cooldown)" },
      { name: "pay", desc: "Send coins to another user" },
      { name: "deposit", desc: "Deposit coins to your bank" },
      { name: "withdraw", desc: "Withdraw coins from your bank" },
      { name: "economy leaderboard", desc: "Top richest members" },
      { name: "rob", desc: "Attempt to rob a user's wallet" },
    ],
  },
};

export function buildHelpEmbed(client: Client) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: "RYZENX™ — Ultra-Advanced Bot System", iconURL: client.user?.displayAvatarURL() })
    .setTitle("⚡ Command Center")
    .setDescription(
      "**Select a category below to view commands.**\n\n" +
      Object.entries(HELP_CATEGORIES)
        .map(([, cat]) => `${cat.emoji} **${cat.name}** — ${cat.description}`)
        .join("\n")
    )
    .addFields({ name: "📌 Quick Access", value: "Mention me or use `!help` (or your server's prefix) anytime.", inline: false })
    .setFooter({ text: `RYZENX™ • ${Object.values(HELP_CATEGORIES).reduce((a: any, c: any) => a + c.commands.length, 0)} commands total` })
    .setTimestamp();
}

export function buildHelpRow() {
  const select = new StringSelectMenuBuilder()
    .setCustomId("help_category")
    .setPlaceholder("⚡ Select a command category...")
    .addOptions(
      Object.entries(HELP_CATEGORIES).map(([value, cat]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(cat.name)
          .setDescription(cat.description)
          .setValue(value)
          .setEmoji(cat.emoji)
      )
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("RYZENX™ command center — browse all commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = buildHelpEmbed(interaction.client);
    const row = buildHelpRow();
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
  },
};
