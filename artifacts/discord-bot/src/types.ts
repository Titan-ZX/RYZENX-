import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  Collection,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<any>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

export interface GuildSettings {
  guild_id: string;
  prefix: string;
  automod_enabled: boolean;
  word_filter: string[];
  link_filter: boolean;
  anti_spam: boolean;
  spam_threshold: number;
  caps_limit: number;
  mention_limit: number;
  anti_raid: boolean;
  raid_threshold: number;
  log_channel: string | null;
  welcome_channel: string | null;
  welcome_message: string | null;
  goodbye_channel: string | null;
  goodbye_message: string | null;
  autorole: string | null;
  starboard_channel: string | null;
  starboard_threshold: number;
  suggestion_channel: string | null;
}

export interface UserLevel {
  user_id: string;
  guild_id: string;
  xp: number;
  level: number;
  total_messages: number;
}

export interface Warning {
  id: number;
  user_id: string;
  guild_id: string;
  moderator_id: string;
  reason: string;
  created_at: Date;
}

export interface Reminder {
  id: number;
  user_id: string;
  channel_id: string;
  message: string;
  remind_at: Date;
}

export interface ReactionRole {
  guild_id: string;
  message_id: string;
  emoji: string;
  role_id: string;
}
