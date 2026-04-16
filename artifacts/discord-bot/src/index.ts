import client from "./client";
import { initDatabase } from "./database";
import { loadCommands } from "./commands";
import { loadEvents } from "./events";
import { startReminderCron } from "./handlers/reminders";
import { startGiveawayCron } from "./handlers/giveaway";

async function main() {
  console.log("[Bot] Starting Discord bot...");

  await initDatabase();
  console.log("[Bot] Database initialized");

  loadCommands(client);
  console.log("[Bot] Commands loaded");

  loadEvents(client);
  console.log("[Bot] Events loaded");

  startReminderCron(client);
  startGiveawayCron(client);

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("[Bot] ERROR: DISCORD_TOKEN environment variable is not set!");
    process.exit(1);
  }

  await client.login(token);
}

main().catch((err) => {
  console.error("[Bot] Fatal error:", err);
  process.exit(1);
});
