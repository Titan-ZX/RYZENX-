import {
  Message,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
} from "discord.js";
import { pool } from "../database";
import { getOrCreateEconomy } from "./economy";
import { calculateLevel } from "./leveling";
import { buildHelpEmbed, buildHelpRow } from "../commands/utility/help";
import { endGiveaway, fetchReactionEntries, pickWinners } from "./giveaway";

const EIGHTBALL_RESPONSES = [
  "✅ It is certain.", "✅ Without a doubt.", "✅ Yes, definitely!",
  "✅ You may rely on it.", "✅ Most likely.", "🟡 Reply hazy, try again.",
  "🟡 Ask again later.", "🟡 Better not tell you now.", "🟡 Cannot predict now.",
  "❌ Don't count on it.", "❌ My reply is no.", "❌ Very doubtful.",
  "❌ Outlook not so good.", "❌ My sources say no.",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function waifu(type: string) {
  return fetch(`https://api.waifu.pics/sfw/${type}`)
    .then((r) => r.json())
    .then((d: any) => d.url as string)
    .catch(() => null);
}

export async function handlePrefixCommand(message: Message, prefix: string) {
  if (!message.content.startsWith(prefix)) return;
  try {
    return await _handlePrefix(message, prefix);
  } catch (err: any) {
    console.error("[Prefix] Error:", err?.message || err);
  }
}

async function _handlePrefix(message: Message, prefix: string) {

  const raw = message.content.slice(prefix.length).trim();
  const args = raw.split(/\s+/);
  const cmd = args.shift()?.toLowerCase() ?? "";
  const guild = message.guild!;
  const author = message.author;
  const member = message.member as GuildMember;

  // ─────────────────────────────────────────────────────────────
  // UTILITY
  // ─────────────────────────────────────────────────────────────

  if (cmd === "help") {
    const embed = buildHelpEmbed(message.client as any);
    const row = buildHelpRow();
    return message.reply({ embeds: [embed], components: [row] });
  }

  if (cmd === "ping") {
    const sent = await message.reply("🏓 Pinging...");
    const ms = sent.createdTimestamp - message.createdTimestamp;
    const ws = message.client.ws.ping;
    const color = ms < 100 ? 0x00ff88 : ms < 200 ? 0xffd700 : 0xff4444;
    return sent.edit({
      content: "",
      embeds: [new EmbedBuilder()
        .setColor(color)
        .setTitle("🏓 Pong!")
        .addFields(
          { name: "📡 API Latency", value: `**${ms}ms**`, inline: true },
          { name: "💓 WS Heartbeat", value: `**${ws}ms**`, inline: true },
        )
        .setFooter({ text: "RYZENX™" }).setTimestamp()],
    });
  }

  if (cmd === "avatar") {
    const target = message.mentions.users.first() || author;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🖼️ ${target.username}'s Avatar`)
      .setImage(target.displayAvatarURL({ size: 1024 }))
      .setFooter({ text: "RYZENX™" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "userinfo") {
    const target = message.mentions.members?.first() || member;
    const user = target.user;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 ID", value: `\`${user.id}\``, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "📥 Joined", value: target.joinedTimestamp ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true },
        { name: "🎭 Top Role", value: `${target.roles.highest}`, inline: true },
        { name: "🤖 Bot?", value: user.bot ? "Yes" : "No", inline: true },
      )
      .setFooter({ text: "RYZENX™" }).setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "serverinfo") {
    const g = guild;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`🏠 ${g.name}`)
      .setThumbnail(g.iconURL({ size: 256 }))
      .addFields(
        { name: "👑 Owner", value: `<@${g.ownerId}>`, inline: true },
        { name: "👥 Members", value: `${g.memberCount}`, inline: true },
        { name: "📣 Channels", value: `${g.channels.cache.size}`, inline: true },
        { name: "🎭 Roles", value: `${g.roles.cache.size}`, inline: true },
        { name: "📅 Created", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "💎 Boosts", value: `${g.premiumSubscriptionCount || 0}`, inline: true },
      )
      .setFooter({ text: "RYZENX™" }).setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "say") {
    if (!args.length) return message.reply("❌ Provide text to say.");
    await message.delete().catch(() => {});
    return (message.channel as TextChannel).send(args.join(" "));
  }

  // ─────────────────────────────────────────────────────────────
  // FUN / GAMES
  // ─────────────────────────────────────────────────────────────

  if (cmd === "8ball" || cmd === "8b") {
    if (!args.length) return message.reply("❌ Ask a question!");
    const answer = EIGHTBALL_RESPONSES[randomInt(0, EIGHTBALL_RESPONSES.length - 1)];
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("🎱 Magic 8-Ball")
      .addFields(
        { name: "❓ Question", value: args.join(" ") },
        { name: "🔮 Answer", value: `**${answer}**` },
      )
      .setFooter({ text: `Asked by ${author.username} • RYZENX™` });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "roll") {
    const sides = parseInt(args[0]) || 6;
    if (sides < 2 || sides > 10000) return message.reply("❌ Sides must be between 2 and 10000.");
    const result = randomInt(1, sides);
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎲 Dice Roll")
      .setDescription(`Rolling a **d${sides}**...\n\n## 🎲 You rolled: **${result}**`)
      .setFooter({ text: "RYZENX™" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "coinflip" || cmd === "flip") {
    const result = Math.random() > 0.5 ? "Heads" : "Tails";
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🪙 Coin Flip")
      .setDescription(`## 🪙 ${result === "Heads" ? "👑 Heads!" : "🌊 Tails!"}`)
      .setFooter({ text: "RYZENX™" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "joke") {
    const res = await fetch("https://official-joke-api.appspot.com/random_joke").catch(() => null);
    if (!res?.ok) return message.reply("😅 Couldn't fetch a joke right now.");
    const data: any = await res.json();
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("😂 Random Joke")
      .setDescription(`**${data.setup}**\n\n||${data.punchline}||`)
      .setFooter({ text: "RYZENX™ • Tap the spoiler for punchline" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "gay") {
    const target = message.mentions.users.first() || author;
    const pct = randomInt(0, 100);
    const bar = "🌈".repeat(Math.floor(pct / 10)) + "⬜".repeat(10 - Math.floor(pct / 10));
    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle("🏳️‍🌈 Gay Meter")
      .setDescription(`**${target.username}** is...\n## ${pct}% Gay\n${bar}`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "RYZENX™ • Just for fun!" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "iq") {
    const target = message.mentions.users.first() || author;
    const iq = randomInt(1, 200);
    const label = iq < 70 ? "😵 Below Average" : iq < 100 ? "🙂 Average" : iq < 130 ? "🧠 Above Average" : iq < 160 ? "🎓 Genius" : "🚀 Off the Charts";
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("🧠 IQ Test")
      .setDescription(`**${target.username}'s IQ:** \n## ${iq} — ${label}`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "RYZENX™ • Totally accurate science" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "pp") {
    const target = message.mentions.users.first() || author;
    const size = randomInt(0, 20);
    const pp = "8" + "=".repeat(size) + "D";
    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle("🌭 PP Meter")
      .setDescription(`**${target.username}'s PP:**\n\`${pp}\` (${size} inches)`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "RYZENX™ • Just for fun!" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "rate") {
    if (!args.length) return message.reply("❌ Provide something to rate!");
    const pct = randomInt(0, 100);
    const stars = "⭐".repeat(Math.ceil(pct / 20));
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("⭐ Rate-o-Meter")
      .setDescription(`I rate **${args.join(" ")}**\n## ${pct}/100 ${stars}`)
      .setFooter({ text: "RYZENX™ • Scientifically accurate" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "hack") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to hack!");
    const msg = await message.reply("```\n[RYZENX™ Hacking System] Initializing...\n```");
    const steps = [
      "📡 Connecting to target IP...",
      "🔓 Bypassing firewall...",
      "💾 Accessing mainframe...",
      "🔍 Scanning files...",
      "📂 Found 2,394 files...",
      "🔑 Cracking password...",
      `✅ Successfully hacked ${target.username}!`,
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      const progress = steps.slice(0, i + 1).map((s, idx) => `${idx === i ? "▶" : "✓"} ${s}`).join("\n");
      await msg.edit(`\`\`\`\n[RYZENX™ Hacking System]\n\n${progress}\n\`\`\``).catch(() => {});
    }
    await new Promise((r) => setTimeout(r, 800));
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("💀 Hack Complete")
      .setDescription(`Successfully hacked **${target.username}**!\n\n🔓 **Email:** h\*\*\*@gmail.com\n📍 **Location:** Classified\n💳 **Balance:** $0.69\n🔑 **Password:** hunter2`)
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "RYZENX™ • This is a joke! No actual hacking occurred." });
    return msg.edit({ content: "", embeds: [embed] });
  }

  if (cmd === "punch") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to punch!");
    const url = await waifu("kick");
    const embed = new EmbedBuilder()
      .setColor(0xff4444)
      .setTitle("👊 Punch!")
      .setDescription(`**${author.username}** punched **${target.username}**! 💥`)
      .setImage(url ?? null)
      .setFooter({ text: "RYZENX™ Social" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "hug") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to hug!");
    const url = await waifu("hug");
    const embed = new EmbedBuilder()
      .setColor(0xff9ff3)
      .setTitle("🤗 Hug!")
      .setDescription(`**${author.username}** hugged **${target.username}**! 💕`)
      .setImage(url ?? null)
      .setFooter({ text: "RYZENX™ Social" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "slap") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to slap!");
    const url = await waifu("slap");
    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle("👋 Slap!")
      .setDescription(`**${author.username}** slapped **${target.username}**! 😤`)
      .setImage(url ?? null)
      .setFooter({ text: "RYZENX™ Social" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "kiss") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to kiss!");
    const url = await waifu("kiss");
    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle("💋 Kiss!")
      .setDescription(`**${author.username}** kissed **${target.username}**! 😘`)
      .setImage(url ?? null)
      .setFooter({ text: "RYZENX™ Social" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "pat") {
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention someone to pat!");
    const url = await waifu("pat");
    const embed = new EmbedBuilder()
      .setColor(0xffeb99)
      .setTitle("👐 Pat!")
      .setDescription(`**${author.username}** patted **${target.username}**! 😊`)
      .setImage(url ?? null)
      .setFooter({ text: "RYZENX™ Social" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "ship") {
    const u1 = message.mentions.users.first();
    const u2 = message.mentions.users.at(1) || author;
    if (!u1) return message.reply("❌ Mention at least one user to ship!");
    const pct = randomInt(0, 100);
    const hearts = "❤️".repeat(Math.floor(pct / 20)) + "🖤".repeat(5 - Math.floor(pct / 20));
    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle("💘 Ship Meter")
      .setDescription(`**${u1.username}** 💕 **${u2.username}**\n\n${hearts}\n## ${pct}% Compatible`)
      .setFooter({ text: "RYZENX™ Shipping Agency" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "slots") {
    const eco = await getOrCreateEconomy(author.id, guild.id);
    const bet = parseInt(args[0]) || 0;
    if (bet > 0 && eco.wallet < bet) return message.reply("❌ Insufficient funds!");

    const reels = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "🎰"];
    const spin = () => reels[Math.floor(Math.random() * reels.length)];
    const s = [spin(), spin(), spin()];
    const isWin = s[0] === s[1] && s[1] === s[2];
    const multipliers: Record<string, number> = { "💎": 10, "⭐": 5, "🎰": 4, "🍇": 3, "🍊": 2, "🍋": 1.5, "🍒": 1.2 };
    const mult = isWin ? multipliers[s[0]] || 2 : 0;
    const winnings = Math.floor(bet * mult);

    if (bet > 0) {
      const delta = winnings - bet;
      await pool.query("UPDATE economy SET wallet = wallet + $1 WHERE user_id = $2 AND guild_id = $3", [delta, author.id, guild.id]);
    }

    const embed = new EmbedBuilder()
      .setColor(isWin ? 0xffd700 : 0x888888)
      .setTitle("🎰 Slots Machine")
      .setDescription(`## [ ${s[0]} | ${s[1]} | ${s[2]} ]\n\n${isWin ? `🎉 **JACKPOT!** You won **${winnings.toLocaleString()}** coins! (${mult}x)` : "💔 **Better luck next time!**"}`)
      .setFooter({ text: `RYZENX™ Economy • Bet: ${bet}` });
    return message.reply({ embeds: [embed] });
  }

  // ─────────────────────────────────────────────────────────────
  // ECONOMY
  // ─────────────────────────────────────────────────────────────

  if (cmd === "balance" || cmd === "bal") {
    const target = message.mentions.members?.first() || member;
    const eco = await getOrCreateEconomy(target.id, guild.id);
    const total = eco.wallet + eco.bank;
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle(`💰 ${target.user.username}'s Balance`)
      .addFields(
        { name: "👛 Wallet", value: `🪙 **${eco.wallet.toLocaleString()}**`, inline: true },
        { name: "🏦 Bank", value: `🪙 **${eco.bank.toLocaleString()}**`, inline: true },
        { name: "💎 Total", value: `🪙 **${total.toLocaleString()}**`, inline: true },
      )
      .setThumbnail(target.user.displayAvatarURL())
      .setFooter({ text: "RYZENX™ Economy" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "daily") {
    const eco = await getOrCreateEconomy(author.id, guild.id);
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const lastDaily = eco.last_daily ? new Date(eco.last_daily).getTime() : 0;
    if (now - lastDaily < cooldown) {
      const remaining = cooldown - (now - lastDaily);
      const h = Math.floor(remaining / 3600000), m = Math.floor((remaining % 3600000) / 60000);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`⏰ Daily already claimed! Resets in **${h}h ${m}m**.`)] });
    }
    const streak = lastDaily && now - lastDaily < cooldown * 2 ? (eco.daily_streak || 0) + 1 : 1;
    const bonus = Math.min(streak * 50, 500);
    const total = 500 + bonus;
    await pool.query("UPDATE economy SET wallet = wallet + $1, last_daily = NOW(), daily_streak = $2 WHERE user_id = $3 AND guild_id = $4", [total, streak, author.id, guild.id]);
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🎁 Daily Claimed!")
      .setDescription(`+🪙 **${total.toLocaleString()}** coins!\n🔥 Streak: **${streak} day${streak > 1 ? "s" : ""}**`)
      .setFooter({ text: "RYZENX™ Economy" });
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "work") {
    const eco = await getOrCreateEconomy(author.id, guild.id);
    const cooldown = 3600000;
    const lastWork = eco.last_work ? new Date(eco.last_work).getTime() : 0;
    if (Date.now() - lastWork < cooldown) {
      const rem = cooldown - (Date.now() - lastWork);
      const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xff6600).setDescription(`⏰ Still on break! Back in **${m}m ${s}s**.`)] });
    }
    const jobs = ["Programmer", "Chef", "Artist", "Driver", "Teacher", "Doctor", "Streamer", "Janitor"];
    const job = jobs[randomInt(0, jobs.length - 1)];
    const earned = randomInt(100, 500);
    await pool.query("UPDATE economy SET wallet = wallet + $1, last_work = NOW() WHERE user_id = $2 AND guild_id = $3", [earned, author.id, guild.id]);
    const embed = new EmbedBuilder()
      .setColor(0x00ff88)
      .setTitle("💼 Work Complete!")
      .setDescription(`You worked as a **${job}** and earned **🪙 ${earned}**!`)
      .setFooter({ text: "RYZENX™ Economy • Cooldown: 1 hour" });
    return message.reply({ embeds: [embed] });
  }

  // ─────────────────────────────────────────────────────────────
  // COMMUNITY
  // ─────────────────────────────────────────────────────────────

  if (cmd === "rank") {
    const target = message.mentions.members?.first() || member;
    const result = await pool.query("SELECT * FROM user_levels WHERE user_id = $1 AND guild_id = $2", [target.id, guild.id]);
    if (!result.rows.length) return message.reply("❌ No rank data found.");
    const data = result.rows[0];
    const level = calculateLevel(data.xp);
    const xpNeeded = Math.floor(100 * Math.pow(level + 1, 1.5));
    const xpBar = Math.floor((data.xp / xpNeeded) * 20);
    const bar = "█".repeat(xpBar) + "░".repeat(20 - xpBar);
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`⭐ ${target.user.username}'s Rank`)
      .addFields(
        { name: "🏅 Level", value: `**${level}**`, inline: true },
        { name: "✨ XP", value: `**${data.xp.toLocaleString()}**`, inline: true },
        { name: "💬 Messages", value: `**${data.total_messages.toLocaleString()}**`, inline: true },
        { name: "📊 Progress", value: `\`[${bar}]\` ${data.xp}/${xpNeeded} XP`, inline: false },
      )
      .setThumbnail(target.user.displayAvatarURL())
      .setFooter({ text: "RYZENX™ Community" });
    return message.reply({ embeds: [embed] });
  }

  // ─────────────────────────────────────────────────────────────
  // MODERATION
  // ─────────────────────────────────────────────────────────────

  if (cmd === "ban") {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply("❌ You need **Ban Members** permission.");
    const target = message.mentions.members?.first();
    if (!target) return message.reply("❌ Mention a member to ban.");
    if (!target.bannable) return message.reply("❌ I cannot ban that member.");
    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.ban({ reason: `${author.tag}: ${reason}` });
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xff4444).setTitle("🔨 Banned").setDescription(`**${target.user.tag}** has been banned.\n**Reason:** ${reason}`).setFooter({ text: "RYZENX™ Security" })] });
  }

  if (cmd === "kick") {
    if (!member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply("❌ You need **Kick Members** permission.");
    const target = message.mentions.members?.first();
    if (!target) return message.reply("❌ Mention a member to kick.");
    if (!target.kickable) return message.reply("❌ I cannot kick that member.");
    const reason = args.slice(1).join(" ") || "No reason provided";
    await target.kick(`${author.tag}: ${reason}`);
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xff8800).setTitle("👢 Kicked").setDescription(`**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`).setFooter({ text: "RYZENX™ Security" })] });
  }

  if (cmd === "mute" || cmd === "timeout") {
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply("❌ You need **Timeout Members** permission.");
    const target = message.mentions.members?.first();
    if (!target) return message.reply("❌ Mention a member to mute.");

    let durationMs = 10 * 60 * 1000;
    let reasonStart = 1;
    const durArg = args[1];
    if (durArg && /^\d+[smhd]$/.test(durArg)) {
      const num = parseInt(durArg);
      const unit = durArg.slice(-1);
      durationMs = num * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit as string]!;
      reasonStart = 2;
    }

    const reason = args.slice(reasonStart).join(" ") || "No reason provided";
    await target.timeout(durationMs, `${author.tag}: ${reason}`);
    const dur = durationMs / 60000;
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xffaa00).setTitle("🔇 Muted").setDescription(`**${target.user.tag}** timed out for **${dur < 60 ? dur + "m" : Math.floor(dur / 60) + "h"}**.\n**Reason:** ${reason}`).setFooter({ text: "RYZENX™ Security" })] });
  }

  if (cmd === "warn") {
    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply("❌ You need **Moderate Members** permission.");
    const target = message.mentions.users.first();
    if (!target) return message.reply("❌ Mention a user to warn.");
    const reason = args.slice(1).join(" ") || "No reason provided";
    await pool.query("INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES ($1, $2, $3, $4)", [target.id, guild.id, author.id, reason]);
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle("⚠️ Warning Issued").setDescription(`**${target.tag}** has been warned.\n**Reason:** ${reason}`).setFooter({ text: "RYZENX™ Security" })] });
  }

  if (cmd === "purge" || cmd === "clear") {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply("❌ You need **Manage Messages** permission.");
    const amount = Math.min(parseInt(args[0]) || 10, 100);
    await (message.channel as TextChannel).bulkDelete(amount + 1, true).catch(() => {});
    return (message.channel as TextChannel).send({
      embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`🗑️ Deleted **${amount}** messages.`)],
    }).then((m) => setTimeout(() => m.delete().catch(() => {}), 3000));
  }

  if (cmd === "unban") {
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply("❌ You need **Ban Members** permission.");
    const userId = args[0];
    if (!userId) return message.reply("❌ Provide a user ID to unban.");
    await guild.bans.remove(userId).catch(() => {});
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ Unbanned user \`${userId}\`.`)] });
  }

  if (cmd === "nick") {
    if (!member.permissions.has(PermissionFlagsBits.ManageNicknames)) return message.reply("❌ You need **Manage Nicknames** permission.");
    const target = message.mentions.members?.first();
    if (!target) return message.reply("❌ Mention a member.");
    const nick = args.slice(1).join(" ") || null;
    await target.setNickname(nick);
    return message.reply({ embeds: [new EmbedBuilder().setColor(0x00ff88).setDescription(`✅ Set ${target}'s nickname to \`${nick || "None"}\`.`)] });
  }

  // ─────────────────────────────────────────────────────────────
  // GIVEAWAY  (reaction-based: react 🎉 to enter)
  // ─────────────────────────────────────────────────────────────

  if (cmd === "gstart") {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply("❌ You need **Manage Server** permission.");
    if (args.length < 3)
      return message.reply("❌ **Usage:** `+gstart <time> <winners> <prize>`\nExample: `+gstart 10m 2 Discord Nitro`");

    const timeStr = args[0];
    const winners = parseInt(args[1]);
    const prize = args.slice(2).join(" ");

    if (isNaN(winners) || winners < 1) return message.reply("❌ Invalid winner count.");
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return message.reply("❌ Invalid time. Use `10m`, `1h`, `2h`, `1d` etc.");

    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const durationMs = parseInt(match[1]) * multipliers[match[2]];
    const endsAt = new Date(Date.now() + durationMs);
    const endsTs  = Math.floor(endsAt.getTime() / 1000);

    const gwResult = await pool.query(
      "INSERT INTO giveaways (guild_id, channel_id, host_id, prize, winners, ends_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [guild.id, message.channel.id, author.id, prize, winners, endsAt]
    );
    const gwId = gwResult.rows[0].id;

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🎉  G I V E A W A Y  🎉")
      .setDescription(`## 🎁 ${prize}\n\nReact with 🎉 below to enter!`)
      .addFields(
        { name: "🏆 Winners",   value: `**${winners}**`,           inline: true },
        { name: "⏰ Ends",      value: `<t:${endsTs}:R>`,          inline: true },
        { name: "📅 End Time",  value: `<t:${endsTs}:F>`,          inline: true },
        { name: "🎪 Hosted by", value: `<@${author.id}>`,          inline: true },
        { name: "🆔 ID",        value: `#${gwId}`,                 inline: true },
      )
      .setFooter({ text: "RYZENX™ Giveaway System  •  React 🎉 to enter!" })
      .setTimestamp(endsAt);

    const msg = await (message.channel as TextChannel).send({ embeds: [embed] });
    await msg.react("🎉").catch(() => {});
    await pool.query("UPDATE giveaways SET message_id = $1 WHERE id = $2", [msg.id, gwId]);
    await message.delete().catch(() => {});
    return;
  }

  if (cmd === "gend") {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply("❌ You need **Manage Server** permission.");
    const gwId = parseInt(args[0]);
    if (isNaN(gwId) || gwId < 1 || gwId > 2_147_483_647) return message.reply("❌ Provide a valid giveaway ID (the small number shown in the giveaway message).");

    const check = await pool.query("SELECT 1 FROM giveaways WHERE id = $1 AND guild_id = $2 AND ended = false", [gwId, guild.id]);
    if (!check.rows.length) return message.reply("❌ Active giveaway not found.");

    const result = await endGiveaway(message.client, gwId, author.tag);
    if (!result) return message.reply("❌ Could not end giveaway.");
    const { winners, entries } = result;
    const winnerText = winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No participants";

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🎉 Giveaway Ended!")
      .setDescription(`🏆 **Winner(s):** ${winnerText}\n👥 **Participants:** ${entries.length}`)
      .setFooter({ text: "RYZENX™ Giveaway System" })
      .setTimestamp()] });
  }

  if (cmd === "greroll") {
    if (!member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply("❌ You need **Manage Server** permission.");
    const gwId = parseInt(args[0]);
    const count = parseInt(args[1]) || 1;
    if (isNaN(gwId) || gwId < 1 || gwId > 2_147_483_647) return message.reply("❌ Provide a valid giveaway ID.");

    const check = await pool.query("SELECT * FROM giveaways WHERE id = $1 AND guild_id = $2", [gwId, guild.id]);
    if (!check.rows.length) return message.reply("❌ Giveaway not found.");

    const giveaway = check.rows[0];
    const entries = await fetchReactionEntries(message.client, giveaway);
    if (!entries.length) return message.reply("❌ No valid entries found.");

    const newWinners = pickWinners(entries, count);
    const winnerText = newWinners.map((id) => `<@${id}>`).join(", ");

    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xff9ff3)
      .setTitle("🔄 Re-rolled!")
      .setDescription(`🎁 **Prize:** ${giveaway.prize}\n🏆 **New Winner(s):** ${winnerText}`)
      .setFooter({ text: `Re-rolled by ${author.tag} • RYZENX™` })
      .setTimestamp()] });
  }

  if (cmd === "glist" || cmd === "gleaderboard") {
    const result = await pool.query(
      "SELECT * FROM giveaways WHERE guild_id = $1 AND ended = false ORDER BY ends_at ASC",
      [guild.id]
    );
    if (!result.rows.length) return message.reply("📭 No active giveaways.");
    const lines = result.rows.map((g: any) => {
      const ts = Math.floor(new Date(g.ends_at).getTime() / 1000);
      return `🎁 **#${g.id}** — **${g.prize}** | Ends <t:${ts}:R> | 🏆 ${g.winners} winner(s)`;
    });
    return message.reply({ embeds: [new EmbedBuilder().setColor(0xffd700).setTitle("🎉 Active Giveaways").setDescription(lines.join("\n")).setFooter({ text: "RYZENX™ Giveaway System" }).setTimestamp()] });
  }
}
