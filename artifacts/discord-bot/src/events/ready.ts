import { ExtendedClient } from "../types";
import { ActivityType, REST, Routes } from "discord.js";
import { allCommands } from "../commands";

export async function onReady(client: ExtendedClient) {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
  console.log(`[Bot] Serving ${client.guilds.cache.size} servers`);

  client.user?.setPresence({
    activities: [{ name: "/help | Z+ Security Bot", type: ActivityType.Watching }],
    status: "online",
  });

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
  const commandData = allCommands.map((c) => c.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commandData,
    });
    console.log(`[Bot] Registered ${commandData.length} global slash commands`);
  } catch (err) {
    console.error("[Bot] Failed to register commands:", err);
  }
}
