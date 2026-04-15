# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains an API server and a full-featured Discord bot.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (API server), pg (Discord bot)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Discord**: discord.js v14, ts-node

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/discord-bot run dev` — run Discord bot locally

## Discord Bot (artifacts/discord-bot)

Multipurpose Discord bot with 34 slash commands across 5 categories.

### Environment Variables
- `DISCORD_TOKEN` — Discord bot token (secret)
- `BOT_DATABASE_URL` — PostgreSQL connection string for the bot database

### Command Categories

**🛡️ Automod (1 command with subcommands)**
- `/automod enable/disable/status` — toggle automod
- `/automod wordfilter add/remove/list` — word filter
- `/automod linkfilter` — link blocking
- `/automod antispam` — spam detection & auto-timeout
- `/automod capslimit` — caps percentage limit
- `/automod mentionlimit` — mention spam limit
- `/automod antiraid` — anti-raid protection
- `/automod logchannel` — set log channel

**🔒 Security (8 commands)**
- `/ban` — ban a user with reason + message deletion
- `/kick` — kick a user
- `/timeout` — timeout a user (1-40320 minutes)
- `/unmute` — remove a timeout
- `/warn` — warn a user (stored in DB)
- `/warnings` — view user warnings
- `/clearwarnings` — clear all warnings
- `/purge` — bulk delete messages (optionally by user)
- `/lockdown` — lock a channel
- `/unlock` — unlock a channel
- `/slowmode` — set slowmode (0 to disable)
- `/softban` — ban+unban to delete messages

**🎉 Fun (8 commands)**
- `/8ball` — magic 8-ball
- `/roll` — dice roll (e.g. 2d6, d20)
- `/coinflip` — heads or tails
- `/joke` — random joke from API
- `/poll` — create a multi-option poll with reactions
- `/rps` — rock paper scissors vs bot
- `/meme` — random meme from Reddit
- `/giveaway start/end` — run giveaways

**🔧 Utility (7 commands)**
- `/ping` — bot latency
- `/serverinfo` — server stats
- `/userinfo` — user info
- `/avatar` — get avatar with links
- `/remind` — set a timed reminder
- `/math` — evaluate math expressions
- `/botinfo` — bot stats and info

**👥 Community (6 commands)**
- `/rank` — view XP rank and progress bar
- `/leaderboard` — top 10 XP leaderboard
- `/welcome setup/goodbye/disable/status` — welcome/goodbye messages
- `/suggest submit/setchannel` — suggestion system
- `/autorole set/disable/status` — auto-role for new members
- `/reactionrole add/remove/list` — reaction role management

### Background Systems
- **XP Leveling** — earn XP per message (60s cooldown), level-up notifications
- **Automod** — word filter, link filter, caps limit, mention spam, anti-spam
- **Welcome/Goodbye** — customizable messages on member join/leave
- **Starboard** — react with ⭐ to star messages (configurable threshold)
- **Reaction Roles** — assign roles via reactions
- **Reminders** — cron-based reminder delivery (checks every minute)

### Database Tables
- `guild_settings` — per-server config (automod, welcome, etc.)
- `user_levels` — XP tracking per user per guild
- `warnings` — moderation warnings
- `reminders` — timed reminders
- `reaction_roles` — reaction role mappings
- `starboard` — starred messages
- `giveaways` — active/ended giveaways
