import { winningLines } from './data.js';

function boardIdSet(board) {
  return new Set(board.items.map((item) => item.id));
}

function initialMarked(board) {
  return new Set(board.items.filter((item) => item.free).map((item) => item.id));
}

export function revealOnBoard(board, markedIds, ids) {
  const marked = new Set(markedIds ?? initialMarked(board));
  const allowed = boardIdSet(board);
  const matched = [];
  for (const id of ids ?? []) {
    if (allowed.has(id)) {
      matched.push(id);
      marked.add(id);
    }
  }
  const win = checkWinner(board, marked);
  return { matched, markedIds: [...marked], winningLine: win.line, hasWinner: win.hasWinner };
}

export function checkWinner(board, markedIds) {
  const marked = markedIds instanceof Set ? markedIds : new Set(markedIds ?? []);
  const lines = winningLines.filter((line) => line.every((position) => marked.has(board.items[position].id)));
  const line = lines[0] ?? null;
  return { hasWinner: lines.length > 0, lines, line, winningPositions: new Set(lines.flat()) };
}

export function createGame(board) {
  let marked = initialMarked(board);
  let win = { winningPositions: new Set(), hasWinner: false };

  function reveal(ids) {
    const result = revealOnBoard(board, marked, ids);
    marked = new Set(result.markedIds);
    win = checkWinner(board, marked);
    return { matched: result.matched, hasWinner: win.hasWinner };
  }

  return {
    reveal,
    isMarked: (id) => marked.has(id),
    isWinningPosition: (position) => win.winningPositions.has(position),
    markedCount: () => marked.size,
  };
}
