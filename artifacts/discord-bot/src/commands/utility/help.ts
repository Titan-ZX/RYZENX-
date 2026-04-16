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
    name: "AutoMod & AI Security",
    emoji: "🛡️",
    color: 0xff6600,
    description: "AI-powered auto-moderation filters",
    commands: [
      { name: "automod enable/disable", desc: "Toggle the entire automod system" },
      { name: "automod wordfilter", desc: "Add/remove/list filtered words" },
      { name: "automod linkfilter", desc: "Block links in messages" },
      { name: "automod antispam", desc: "Auto-timeout message spammers" },
      { name: "automod capslimit", desc: "Set maximum caps percentage allowed" },
      { name: "automod mentionlimit", desc: "Limit mass mention spam" },
      { name: "automod antiraid", desc: "Anti-raid protection mode" },
      { name: "automod logchannel", desc: "Set moderation log channel" },
      { name: "automod status", desc: "View all current automod settings" },
    ],
  },
  security: {
    name: "Security & Moderation",
    emoji: "⚔️",
    color: 0xff0000,
    description: "Z+ server security & moderation tools",
    commands: [
      { name: "ban", desc: "Ban a user with optional message deletion" },
      { name: "kick", desc: "Kick a member from the server" },
      { name: "timeout", desc: "Timeout a member (1m – 28d)" },
      { name: "unmute", desc: "Remove a timeout from a member" },
      { name: "softban", desc: "Ban + unban to wipe messages" },
      { name: "warn", desc: "Issue a formal warning (stored in DB)" },
      { name: "warnings", desc: "View all warnings for a user" },
      { name: "clearwarnings", desc: "Clear all warnings for a user" },
      { name: "purge", desc: "Bulk delete messages (1–100)" },
      { name: "lockdown", desc: "Lock a channel for @everyone" },
      { name: "unlock", desc: "Unlock a previously locked channel" },
      { name: "slowmode", desc: "Set slowmode delay (0 = disable)" },
      { name: "unban", desc: "Unban a user by ID" },
      { name: "massban", desc: "Ban multiple users by ID at once" },
      { name: "nick", desc: "Change a member's nickname" },
      { name: "nuke", desc: "Delete & recreate a channel" },
      { name: "addrole", desc: "Add a role to a member" },
      { name: "removerole", desc: "Remove a role from a member" },
      { name: "dehoist", desc: "Remove hoisted names from all members" },
      { name: "modnote", desc: "Add/view/delete mod notes on users" },
      { name: "antinuke", desc: "Anti-nuke protection system" },
    ],
  },
  fun: {
    name: "Fun & Games",
    emoji: "🎮",
    color: 0xffd700,
    description: "Games, entertainment & social fun",
    commands: [
      { name: "8ball", desc: "Ask the magic 8-ball a question" },
      { name: "roll", desc: "Roll dice (e.g. 2d6, d20, 3d8)" },
      { name: "coinflip", desc: "Flip a coin — heads or tails" },
      { name: "rps", desc: "Rock paper scissors vs the bot" },
      { name: "joke", desc: "Random joke from the joke API" },
      { name: "meme", desc: "Random meme from Reddit" },
      { name: "poll", desc: "Create a poll with reactions" },
      { name: "trivia", desc: "Trivia questions with auto-reveal" },
      { name: "tictactoe", desc: "Tic-Tac-Toe vs another user" },
      { name: "blackjack", desc: "Blackjack card game with betting" },
      { name: "slots", desc: "Spin the slot machine — win big!" },
      { name: "hangman", desc: "Classic Hangman word game" },
      { name: "guess", desc: "Guess the number (1–1000)" },
      { name: "truthordare", desc: "Random truth or dare" },
      { name: "neverhaveiever", desc: "Never Have I Ever statements" },
      { name: "wouldyourather", desc: "Would You Rather questions" },
      { name: "ship", desc: "Check compatibility between two users" },
      { name: "textfun", desc: "Text transformations (reverse, mock, owoify...)" },
      { name: "giveaway", desc: "Create & manage server giveaways" },
      { name: "social", desc: "Social actions (hug, pat, slap, kiss...)" },
    ],
  },
  utility: {
    name: "Utility",
    emoji: "🔧",
    color: 0x00aaff,
    description: "Powerful server & user utilities",
    commands: [
      { name: "ping", desc: "Bot latency & WebSocket status" },
      { name: "serverinfo", desc: "Detailed server statistics" },
      { name: "userinfo", desc: "Detailed user information & roles" },
      { name: "avatar", desc: "Get a user's avatar in all formats" },
      { name: "channelinfo", desc: "Get info about any channel" },
      { name: "roleinfo", desc: "Get info about any role" },
      { name: "listroles", desc: "List all server roles" },
      { name: "listbots", desc: "List all bots in the server" },
      { name: "remind", desc: "Set a reminder (10s, 5m, 2h, 1d)" },
      { name: "botinfo", desc: "RYZENX™ system stats & uptime" },
      { name: "embed", desc: "Create a custom embed message" },
      { name: "announce", desc: "Send a server announcement" },
      { name: "say", desc: "Make the bot say something" },
      { name: "afk", desc: "Set your AFK status" },
      { name: "base64", desc: "Encode/decode Base64 text" },
      { name: "timestamp", desc: "Convert dates to Discord timestamps" },
      { name: "color", desc: "View hex color info & preview" },
      { name: "stealemoji", desc: "Add an emoji from another server" },
      { name: "calc", desc: "Advanced math expression evaluator" },
      { name: "setprefix", desc: "Set custom prefix for this server" },
      { name: "help", desc: "This interactive help menu" },
    ],
  },
  community: {
    name: "Community",
    emoji: "🌟",
    color: 0x00ff88,
    description: "Community engagement & XP tools",
    commands: [
      { name: "rank", desc: "View XP rank & progress bar" },
      { name: "leaderboard", desc: "Top 10 XP leaderboard" },
      { name: "profile", desc: "View a user's full server profile" },
      { name: "bio", desc: "Set your profile bio" },
      { name: "birthday set", desc: "Set your birthday" },
      { name: "birthday list", desc: "Upcoming birthdays list" },
      { name: "welcome setup", desc: "Set welcome channel & message" },
      { name: "suggest submit", desc: "Submit a server suggestion" },
      { name: "autorole set", desc: "Auto-assign roles to new members" },
      { name: "reactionrole add", desc: "Add a reaction role to a message" },
      { name: "lvlroles add", desc: "Add level-up role rewards" },
      { name: "resetxp", desc: "Reset XP for a user or server" },
      { name: "noexp", desc: "Disable XP in specific channels" },
      { name: "starboard", desc: "Configure the starboard system" },
    ],
  },
  economy: {
    name: "Economy",
    emoji: "💰",
    color: 0xffd700,
    description: "Coins, gambling & trading",
    commands: [
      { name: "balance", desc: "View wallet, bank & net worth" },
      { name: "daily", desc: "Claim daily coins + streak bonus" },
      { name: "work", desc: "Work a job for coins (1h cooldown)" },
      { name: "fish", desc: "Go fishing for rare catches" },
      { name: "hunt", desc: "Hunt animals for coin rewards" },
      { name: "mine", desc: "Mine ores — find diamonds!" },
      { name: "beg", desc: "Beg strangers for coins" },
      { name: "crime", desc: "Commit crimes for big money (risky!)" },
      { name: "slots", desc: "Spin the slot machine with a bet" },
      { name: "blackjack", desc: "Blackjack vs the dealer" },
      { name: "gamble", desc: "Double or nothing — 48% win chance" },
      { name: "rob", desc: "Rob a user's wallet (risky!)" },
      { name: "pay", desc: "Send coins to another user" },
      { name: "deposit", desc: "Deposit coins to your bank" },
      { name: "withdraw", desc: "Withdraw coins from your bank" },
      { name: "shop", desc: "Browse & buy items from the shop" },
      { name: "inventory", desc: "View your item inventory" },
      { name: "richlb", desc: "Richest members leaderboard" },
    ],
  },
  systems: {
    name: "Bot Systems",
    emoji: "⚙️",
    color: 0x9966ff,
    description: "Core systems: Voice Master & Tickets",
    commands: [
      { name: "voicemaster setup", desc: "Set up automatic private VCs" },
      { name: "voicemaster name", desc: "Rename your voice channel" },
      { name: "voicemaster lock", desc: "Lock your VC to prevent joins" },
      { name: "voicemaster unlock", desc: "Unlock your voice channel" },
      { name: "voicemaster limit", desc: "Set user limit for your VC" },
      { name: "voicemaster kick", desc: "Kick a user from your VC" },
      { name: "voicemaster ban", desc: "Ban a user from your VC" },
      { name: "voicemaster permit", desc: "Allow a specific user into your VC" },
      { name: "voicemaster hide", desc: "Hide your VC from others" },
      { name: "voicemaster show", desc: "Make your VC visible again" },
      { name: "voicemaster claim", desc: "Claim an ownerless VC" },
      { name: "voicemaster bitrate", desc: "Set your VC bitrate" },
      { name: "voicemaster transfer", desc: "Transfer VC ownership" },
      { name: "ticket setup", desc: "Configure the ticket system" },
      { name: "ticket panel", desc: "Deploy a ticket panel in a channel" },
      { name: "ticket create", desc: "Open a support ticket" },
      { name: "ticket close", desc: "Close a ticket channel" },
      { name: "ticket add/remove", desc: "Add/remove users from a ticket" },
      { name: "ticket claim", desc: "Claim a ticket as support staff" },
      { name: "ticket list", desc: "List all open tickets" },
    ],
  },
};

const TOTAL = Object.values(HELP_CATEGORIES).reduce((a: any, c: any) => a + c.commands.length, 0);

export function buildHelpEmbed(client: Client) {
  const cats = Object.values(HELP_CATEGORIES);
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setAuthor({ name: "RYZENX™  |  Ultra-Advanced Discord Bot", iconURL: client.user?.displayAvatarURL() })
    .setTitle("⚡ Command Center")
    .setDescription(
      "**Welcome to RYZENX™ — your all-in-one server solution!**\n" +
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
      cats.map((c: any) => `${c.emoji} **${c.name}** • ${c.commands.length} cmds`).join("\n") +
      `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📋 **${TOTAL}+ total commands** — Select a category below!`
    )
    .setThumbnail(client.user?.displayAvatarURL({ size: 256 }) ?? null)
    .setFooter({ text: `RYZENX™  •  Serving your server 24/7  •  ${TOTAL}+ commands` })
    .setTimestamp();
}

export function buildHelpRow() {
  const select = new StringSelectMenuBuilder()
    .setCustomId("help_category")
    .setPlaceholder("⚡ Choose a category to explore...")
    .addOptions(
      Object.entries(HELP_CATEGORIES).map(([value, cat]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(cat.name)
          .setDescription(`${cat.commands.length} commands — ${cat.description}`)
          .setValue(value)
          .setEmoji(cat.emoji)
      )
    );
  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
}

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("⚡ RYZENX™ command center — browse all 150+ commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = buildHelpEmbed(interaction.client);
    const row = buildHelpRow();
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
