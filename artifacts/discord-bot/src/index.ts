import client from "./client";
import { initDatabase } from "./database";
import { loadCommands } from "./commands";
import { loadEvents } from "./events";
import { startReminderCron } from "./handlers/reminders";
import { startGiveawayCron } from "./handlers/giveaway";
import { startServer } from "./Serverinfo";

async function main() {
  console.log("[Bot] Starting Discord bot...");

  // 🔹 DB (safe)
  try {
    await initDatabase();
    console.log("[Bot] Database initialized");
  } catch (err) {
    console.warn("[Bot] Database skipped");
  }

  // 🔹 Commands
  try {
    loadCommands(client);
    console.log("[Bot] Commands loaded");
  } catch (err) {
    console.error("[Bot] Commands failed:", err);
  }

  // 🔹 Events
  try {
    loadEvents(client);
    console.log("[Bot] Events loaded");
  } catch (err) {
    console.error("[Bot] Events failed:", err);
  }

  // 🔹 Cron jobs
  try {
    startReminderCron(client);
    startGiveawayCron(client);
  } catch (err) {
    console.warn("[Bot] Cron failed");
  }

  // 🔹 Token check
  const token = process.env.DISCORD_TOKEN;
  console.log("Token check:", token ? "OK" : "MISSING");

  if (!token) {
    console.error("[Bot] ERROR: DISCORD_TOKEN not set!");
    process.exit(1);
  }

  // 🔹 Login
  await client.login(token);
  console.log("[Bot] Logged in successfully");

  // 🔹 Server (optional)
  try {
    startServer();
  } catch {
    console.warn("[Bot] Server not started");
  }
}

main().catch((err) => {
  console.error("[Bot] Fatal error:", err);
  process.exit(1);
});
