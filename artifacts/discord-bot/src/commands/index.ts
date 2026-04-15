import { ExtendedClient } from "../types";

import automod from "./automod/automod";
import ban from "./security/ban";
import kick from "./security/kick";
import timeout from "./security/timeout";
import unmute from "./security/unmute";
import warn from "./security/warn";
import warnings from "./security/warnings";
import clearwarnings from "./security/clearwarnings";
import purge from "./security/purge";
import lockdown from "./security/lockdown";
import unlock from "./security/unlock";
import slowmode from "./security/slowmode";
import softban from "./security/softban";
import eightball from "./fun/eightball";
import roll from "./fun/roll";
import coinflip from "./fun/coinflip";
import joke from "./fun/joke";
import poll from "./fun/poll";
import rps from "./fun/rps";
import meme from "./fun/meme";
import ping from "./utility/ping";
import serverinfo from "./utility/serverinfo";
import userinfo from "./utility/userinfo";
import avatar from "./utility/avatar";
import remind from "./utility/remind";
import botinfo from "./utility/botinfo";
import math from "./utility/math";
import rank from "./community/rank";
import leaderboard from "./community/leaderboard";
import welcome from "./community/welcome";
import suggest from "./community/suggest";
import autorole from "./community/autorole";
import reactionrole from "./community/reactionrole";
import giveaway from "./fun/giveaway";

const allCommands = [
  automod,
  ban, kick, timeout, unmute, warn, warnings, clearwarnings, purge, lockdown, unlock, slowmode, softban,
  eightball, roll, coinflip, joke, poll, rps, meme, giveaway,
  ping, serverinfo, userinfo, avatar, remind, botinfo, math,
  rank, leaderboard, welcome, suggest, autorole, reactionrole,
];

export function loadCommands(client: ExtendedClient) {
  for (const command of allCommands) {
    client.commands.set(command.data.name, command);
  }
  console.log(`[Commands] Loaded ${allCommands.length} commands`);
}

export { allCommands };
