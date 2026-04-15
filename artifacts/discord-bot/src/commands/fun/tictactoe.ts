import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const activeGames = new Map<string, any>();

function renderBoard(board: string[]): string {
  const symbols: Record<string, string> = { "": "⬜", X: "❌", O: "⭕" };
  return [0, 3, 6].map((r) => board.slice(r, r + 3).map((c) => symbols[c]).join("")).join("\n");
}

function checkWin(board: string[], sym: string): boolean {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some((w) => w.every((i) => board[i] === sym));
}

export { activeGames };

export default {
  data: new SlashCommandBuilder()
    .setName("tictactoe")
    .setDescription("❌⭕ Play Tic-Tac-Toe against another user!")
    .addUserOption((opt) => opt.setName("opponent").setDescription("Your opponent").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    const opponent = interaction.options.getUser("opponent", true);
    if (opponent.bot) return interaction.reply({ content: "❌ You can't play against bots!", ephemeral: true });
    if (opponent.id === interaction.user.id) return interaction.reply({ content: "❌ You can't play against yourself!", ephemeral: true });

    const gameKey = `${interaction.guildId}-${interaction.channelId}`;
    if (activeGames.has(gameKey)) return interaction.reply({ content: "❌ There's already an active game in this channel!", ephemeral: true });

    const board = Array(9).fill("");
    const game = { board, players: [interaction.user.id, opponent.id], current: 0, symbols: ["X", "O"], channelId: interaction.channelId };
    activeGames.set(gameKey, game);

    const buildComponents = (disabled = false) => {
      return [0, 3, 6].map((row) => {
        const syms: Record<string, string> = { X: "❌", O: "⭕", "": "⬜" };
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
          [0, 1, 2].map((col) => {
            const idx = row + col;
            return new ButtonBuilder()
              .setCustomId(`ttt_${idx}_${gameKey}`)
              .setLabel(board[idx] || "·")
              .setEmoji(board[idx] ? (board[idx] === "X" ? "❌" : "⭕") : "⬜")
              .setStyle(board[idx] ? ButtonStyle.Primary : ButtonStyle.Secondary)
              .setDisabled(!!board[idx] || disabled);
          })
        );
      });
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("❌⭕ Tic-Tac-Toe")
      .setDescription(`**${interaction.user.username}** (❌) vs **${opponent.username}** (⭕)\n\n${interaction.user.username}'s turn!`)
      .setFooter({ text: "RYZENX™ Games" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], components: buildComponents() });
  },
};
