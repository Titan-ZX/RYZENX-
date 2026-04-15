import { Message, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { ExtendedClient } from "../types";
import { handleAutomod } from "../handlers/automod";
import { handleLeveling } from "../handlers/leveling";
import { getGuildSettings } from "../database";
import { buildHelpEmbed, buildHelpRow } from "../commands/utility/help";

const spamMap = new Map<string, { count: number; lastMessage: number }>();

export async function onMessageCreate(client: ExtendedClient, message: Message) {
  if (message.author.bot || !message.guild) return;

  const isMentioned = message.mentions.has(client.user!) && message.content.trim().match(/^<@!?(\d+)>$/);

  if (isMentioned) {
    const embed = buildHelpEmbed(client);
    const row = buildHelpRow();
    await message.reply({ embeds: [embed], components: [row] });
    return;
  }

  await handleAutomod(message, spamMap);
  await handleLeveling(message);

  const settings = await getGuildSettings(message.guild.id);
  const prefix = settings.prefix || "!";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift()?.toLowerCase();

  if (cmdName === "help") {
    const embed = buildHelpEmbed(client);
    const row = buildHelpRow();
    await message.reply({ embeds: [embed], components: [row] });
  }
}
