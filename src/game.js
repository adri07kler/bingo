import { winningLines } from './data.js';

export function createGame(board) {
  const marked = new Set(board.items.filter((item) => item.free).map((item) => item.id));
  const winningPositions = new Set();

  function reveal(ids) {
    const boardIds = new Set(board.items.map((item) => item.id));
    ids.filter((id) => boardIds.has(id)).forEach((id) => marked.add(id));
    const newLines = winningLines.filter((line) => line.every((position) => marked.has(board.items[position].id)));
    newLines.forEach((line) => line.forEach((position) => winningPositions.add(position)));
    return { matched: ids.filter((id) => boardIds.has(id)), hasWinner: newLines.length > 0 };
  }

  return {
    reveal,
    isMarked: (id) => marked.has(id),
    isWinningPosition: (position) => winningPositions.has(position),
    markedCount: () => marked.size,
  };
}
