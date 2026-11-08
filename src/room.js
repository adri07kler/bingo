import { boards, rounds, winningLines } from './data.js';
import { checkWinner } from './game.js';

export function boardById(boardId) {
  return boards.find((board) => board.id === boardId) ?? null;
}

export function initialMarkedForBoard(board) {
  return board.items.filter((item) => item.free).map((item) => item.id);
}

export function ensureParticipantBoard(room, userId, boardId) {
  const participant = room.participants[userId];
  const board = boardById(boardId);
  if (!participant || !board) return { error: 'No se pudo asignar el tablero.' };
  if (participant.boardId === boardId && participant.markedIds?.length) return { ok: true };
  participant.boardId = boardId;
  participant.markedIds = initialMarkedForBoard(board);
  participant.winningLine = null;
  return { ok: true };
}

function activeTurnIndex(room) {
  const idx = room.turnOrder.indexOf(room.activeTurnUserId);
  return idx >= 0 ? idx : 0;
}

export function applyDiscoveryToAll(room, revealedIds) {
  const winners = [];
  for (const userId of room.turnOrder) {
    const participant = room.participants[userId];
    const board = boardById(participant?.boardId);
    if (!participant || !board) continue;
    const marked = new Set(participant.markedIds?.length ? participant.markedIds : initialMarkedForBoard(board));
    const allowed = new Set(board.items.map((item) => item.id));
    for (const id of revealedIds ?? []) if (allowed.has(id)) marked.add(id);
    participant.markedIds = [...marked];
    const win = checkWinner(board, participant.markedIds);
    participant.winningLine = win.line;
    if (win.hasWinner) winners.push({ userId, line: win.line });
  }
  room.winnerUserId = resolveWinner(room, winners);
  return { winners, winnerUserId: room.winnerUserId };
}

function resolveWinner(room, winners) {
  if (!winners.length) return null;
  if (winners.some((w) => w.userId === room.activeTurnUserId)) return room.activeTurnUserId;
  for (const userId of room.turnOrder) if (winners.some((w) => w.userId === userId)) return userId;
  return winners[0].userId;
}

export function recordAnswer(room, { activeUserId, answerIndex, revealedIds }) {
  room.roundHistory.push({ roundIndex: room.roundIndex, activeUserId, answerIndex, revealedIds });
  room.roundPhase = 'discovery';
}

export function advanceAfterMarked(room) {
  if (room.winnerUserId) {
    room.roundPhase = 'result';
    return room;
  }
  const lastRound = room.roundIndex >= rounds.length - 1;
  if (lastRound) {
    room.roundPhase = 'result';
    room.winnerUserId = room.winnerUserId ?? null;
    return room;
  }
  room.roundIndex += 1;
  room.roundPhase = 'question';
  const idx = activeTurnIndex(room);
  room.activeTurnUserId = room.turnOrder[(idx + 1) % room.turnOrder.length] ?? room.activeTurnUserId;
  return room;
}

export function resetRoomGame(room) {
  room.roundIndex = 0;
  room.roundPhase = 'question';
  room.roundHistory = [];
  room.winnerUserId = null;
  room.activeTurnUserId = room.turnOrder[0] ?? null;
  for (const participant of Object.values(room.participants)) {
    participant.winningLine = null;
    const board = boardById(participant.boardId);
    participant.markedIds = board ? initialMarkedForBoard(board) : [];
  }
}

export function canStartRoom(room) {
  return room.turnOrder.length > 0 && room.turnOrder.every((userId) => room.participants[userId]?.boardId);
}

export function roomProgress(room) {
  return rounds.length ? { current: Math.min(room.roundIndex + 1, rounds.length), total: rounds.length } : { current: 0, total: 0 };
}

export { rounds, boards, winningLines };
