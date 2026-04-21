import client from "./client";
import { initDatabase } from "./database";
import { loadCommands } from "./commands";
import { loadEvents } from "./events";
import { startReminderCron } from "./handlers/reminders";
import { startGiveawayCron } from "./handlers/giveaway";
import express from "express";

// 🔥 Crash debug (VERY IMPORTANT)
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION:", err);
});
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err);
});

// 🌐 Express server (Render fix)
const app = express();
app.get("/", (req, res) => {
  res.send("Bot is running ✅");
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Web server running on port " + PORT);
});

async function main() {
  console.log("[Bot] Starting Discord bot...");

  // 🔹 Token check FIRST
  const token = process.env.DISCORD_TOKEN;
  console.log("Token check:", token ? "OK" : "MISSING");

  if (!token) {
    console.error("[Bot] ERROR: DISCORD_TOKEN not set!");
    process.exit(1);
  }

  // 🔹 Try ONLY login first (debug mode)
  await client.login(token);
  console.log("[Bot] Logged in successfully");

  // 🔹 बाकी सब बाद में (optional)
  try {
    await initDatabase();
    console.log("[Bot] Database initialized");
  } catch {
    console.warn("[Bot] Database skipped");
  }

  try {
    loadCommands(client);
    console.log("[Bot] Commands loaded");
  } catch (err) {
    console.error("[Bot] Commands failed:", err);
  }

  try {
    loadEvents(client);
    console.log("[Bot] Events loaded");
  } catch (err) {
    console.error("[Bot] Events failed:", err);
  }

  try {
    startReminderCron(client);
    startGiveawayCron(client);
  } catch {
    console.warn("[Bot] Cron failed");
  }
}

main().catch((err) => {
  console.error("[Bot] Fatal error:", err);
  process.exit(1);
});
