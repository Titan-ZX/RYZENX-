import { ExtendedClient } from "../types";
import { onReady } from "./ready";
import { onInteractionCreate } from "./interactionCreate";
import { onMessageCreate } from "./messageCreate";
import { onGuildMemberAdd } from "./guildMemberAdd";
import { onGuildMemberRemove } from "./guildMemberRemove";
import { onMessageReactionAdd } from "./messageReactionAdd";

export function loadEvents(client: ExtendedClient) {
  client.once("clientReady", () => onReady(client));
  client.on("interactionCreate", (interaction) => onInteractionCreate(client, interaction));
  client.on("messageCreate", (message) => onMessageCreate(client, message));
  client.on("guildMemberAdd", (member) => onGuildMemberAdd(member));
  client.on("guildMemberRemove", (member) => onGuildMemberRemove(member));
  client.on("messageReactionAdd", (reaction, user) => onMessageReactionAdd(reaction as any, user as any));
}
