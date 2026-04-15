import { Message } from "discord.js";
import { ExtendedClient } from "../types";
import { handleAutomod } from "../handlers/automod";
import { handleLeveling } from "../handlers/leveling";

const spamMap = new Map<string, { count: number; lastMessage: number }>();

export async function onMessageCreate(client: ExtendedClient, message: Message) {
  if (message.author.bot || !message.guild) return;

  await handleAutomod(message, spamMap);
  await handleLeveling(message);
}
