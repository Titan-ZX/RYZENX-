import { ExtendedClient } from "../types";

// Existing
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
import giveaway from "./fun/giveaway";
import ping from "./utility/ping";
import serverinfo from "./utility/serverinfo";
import userinfo from "./utility/userinfo";
import avatar from "./utility/avatar";
import remind from "./utility/remind";
import botinfo from "./utility/botinfo";
import math from "./utility/math";
import help from "./utility/help";
import setprefix from "./utility/setprefix";
import rank from "./community/rank";
import leaderboard from "./community/leaderboard";
import welcome from "./community/welcome";
import suggest from "./community/suggest";
import autorole from "./community/autorole";
import reactionrole from "./community/reactionrole";
import balance from "./economy/balance";
import daily from "./economy/daily";
import work from "./economy/work";
import pay from "./economy/pay";
import deposit from "./economy/deposit";
import withdraw from "./economy/withdraw";
import rob from "./economy/rob";
import richlb from "./economy/econleaderboard";

// 🆕 Discord Native AutoMod
import discordmod from "./automod/discordmod";

// 🆕 Voice Master
import voicemaster from "./voicemaster/voicemaster";

// 🆕 Ticket System
import ticket from "./tickets/ticket";

// 🆕 Social
import social from "./social/social";

// 🆕 Fun/Games
import textfun from "./fun/textfun";
import trivia from "./fun/trivia";
import slots from "./fun/slots";
import blackjack from "./fun/blackjack";
import tictactoe from "./fun/tictactoe";
import truthordare from "./fun/truthordare";
import neverhaveiever from "./fun/neverhaveiever";
import wouldyourather from "./fun/wouldyourather";
import ship from "./fun/ship";
import guess from "./fun/guess";
import hangman from "./fun/hangman";

// 🆕 Security
import unban from "./security/unban";
import massban from "./security/massban";
import nick from "./security/nick";
import nuke from "./security/nuke";
import addrole from "./security/addrole";
import removerole from "./security/removerole";
import dehoist from "./security/dehoist";
import modnote from "./security/modnote";
import antinuke from "./security/antinuke";
import history from "./security/history";
import lockserver from "./security/lockserver";
import viewbans from "./security/viewbans";
import modcase from "./security/case";
import modlog from "./security/modlog";

// 🆕 Economy
import fish from "./economy/fish";
import hunt from "./economy/hunt";
import mine from "./economy/mine";
import beg from "./economy/beg";
import crime from "./economy/crime";
import gamble from "./economy/gamble";
import shop from "./economy/shop";
import inventory from "./economy/inventory";

// 🆕 Utility
import channelinfo from "./utility/channelinfo";
import roleinfo from "./utility/roleinfo";
import listroles from "./utility/listroles";
import listbots from "./utility/listbots";
import embed from "./utility/embed";
import announce from "./utility/announce";
import afk from "./utility/afk";
import say from "./utility/say";
import base64 from "./utility/base64";
import timestamp from "./utility/timestamp";
import color from "./utility/color";
import stealemoji from "./utility/stealemoji";
import calc from "./utility/calc";

// 🆕 Community
import profile from "./community/profile";
import bio from "./community/bio";
import birthday from "./community/birthday";
import lvlroles from "./community/lvlroles";
import resetxp from "./community/resetxp";
import noexp from "./community/noexp";
import starboard from "./community/starboard";

const allCommands = [
  // Core Security (12) + Discord AutoMod
  automod, discordmod, ban, kick, timeout, unmute, warn, warnings, clearwarnings, purge, lockdown, unlock, slowmode, softban,
  // Extended Security (9 + 5 new)
  unban, massban, nick, nuke, addrole, removerole, dehoist, modnote, antinuke,
  history, lockserver, modcase, modlog,
  // Fun/Games (11 original + 11 new = 22)
  eightball, roll, coinflip, joke, poll, rps, meme, giveaway,
  textfun, trivia, slots, blackjack, tictactoe, truthordare, neverhaveiever, wouldyourather, ship, guess, hangman,
  // Utility (9 original + 13 new = 22)
  ping, serverinfo, userinfo, avatar, remind, botinfo, math, help, setprefix,
  channelinfo, roleinfo, listroles, listbots, embed, announce, afk, say, base64, timestamp, color, stealemoji, calc,
  // Community (6 original + 7 new = 13)
  rank, leaderboard, welcome, suggest, autorole, reactionrole,
  profile, bio, birthday, lvlroles, resetxp, noexp, starboard,
  // Economy (8 original + 8 new = 16)
  balance, daily, work, pay, deposit, withdraw, rob, richlb,
  fish, hunt, mine, beg, crime, gamble, shop, inventory,
  // Systems
  voicemaster, ticket, social,
];

export function loadCommands(client: ExtendedClient) {
  for (const command of allCommands) {
    client.commands.set(command.data.name, command);
  }
  console.log(`[Commands] Loaded ${allCommands.length} commands`);
}

export { allCommands };
