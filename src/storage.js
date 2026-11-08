const KEY = 'bingoSocial.v1';

function emptyState() {
  return { version: 1, users: {}, session: { userId: null }, rooms: {} };
}

function memoryStore() {
  let value = null;
  return {
    get: () => value,
    set: (v) => { value = v; },
    ok: false,
  };
}

const store = (() => {
  try {
    const probe = '__bingo_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return { get: () => localStorage.getItem(KEY), set: (v) => localStorage.setItem(KEY, v), ok: true };
  } catch {
    return memoryStore();
  }
})();

export function storageAvailable() {
  return store.ok;
}

export function loadState() {
  try {
    const raw = store.get();
    if (!raw) return emptyState();
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || typeof data.users !== 'object' || typeof data.rooms !== 'object') {
      return emptyState();
    }
    data.session = data.session && typeof data.session === 'object' ? data.session : { userId: null };
    return data;
  } catch {
    return emptyState();
  }
}

export function saveState(state) {
  try {
    store.set(JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo guardar' };
  }
}

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function hashPin(pin) {
  let h = 5381;
  const text = `bingo:${pin}`;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h) ^ text.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function normalizeName(name) {
  return String(name ?? '').trim();
}

function nameKey(name) {
  return normalizeName(name).toLocaleLowerCase();
}

export function listUsers(state) {
  return Object.values(state.users).sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export function findUserByName(state, name) {
  const key = nameKey(name);
  return Object.values(state.users).find((user) => nameKey(user.name) === key) ?? null;
}

export function createUser(state, { name, pin }) {
  const cleanName = normalizeName(name);
  if (cleanName.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' };
  if (findUserByName(state, cleanName)) return { error: 'Ese nombre ya está registrado en este navegador.' };
  if (!/^\d{4,6}$/.test(String(pin ?? ''))) return { error: 'El PIN debe tener 4 a 6 dígitos.' };
  const user = { id: uid(), name: cleanName, pinHash: hashPin(pin), createdAt: Date.now() };
  state.users[user.id] = user;
  const saved = saveState(state);
  return saved.ok ? { user } : { error: 'No se pudo guardar la cuenta en este navegador.' };
}

export function registerUser(state, payload) {
  const result = createUser(state, payload);
  if (result.error) return result;
  state.session.userId = result.user.id;
  saveState(state);
  return result;
}

export function verifyPin(state, userId, pin) {
  const user = state.users[userId];
  return !!user && user.pinHash === hashPin(pin);
}

export function loginUser(state, { name, pin }) {
  const user = findUserByName(state, name);
  if (!user || !verifyPin(state, user.id, pin)) return { error: 'Nombre o PIN incorrectos.' };
  state.session.userId = user.id;
  saveState(state);
  return { user };
}

export function getSessionUser(state) {
  const id = state.session?.userId;
  return id && state.users[id] ? state.users[id] : null;
}

export function logout(state) {
  state.session.userId = null;
  saveState(state);
}

const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(state) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let body = '';
    for (let i = 0; i < 4; i += 1) body += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
    const code = `BINGO-${body}`;
    if (!state.rooms[code]) return code;
  }
  return `BINGO-${uid().slice(-4).toUpperCase()}`;
}

function newParticipant(userId) {
  return { userId, joinedAt: Date.now(), boardId: null, markedIds: [], winningLine: null };
}

export function createRoom(state, { name, hostUserId }) {
  const cleanName = normalizeName(name) || 'Sala de equipo';
  const code = generateRoomCode(state);
  state.rooms[code] = {
    code,
    name: cleanName.slice(0, 60),
    hostUserId,
    createdAt: Date.now(),
    roundIndex: 0,
    roundPhase: 'question',
    roundHistory: [],
    turnOrder: [hostUserId],
    activeTurnUserId: hostUserId,
    winnerUserId: null,
    participants: { [hostUserId]: newParticipant(hostUserId) },
  };
  const saved = saveState(state);
  return saved.ok ? { room: state.rooms[code] } : { error: 'No se pudo crear la sala.' };
}

export function getRoom(state, code) {
  const key = String(code ?? '').trim().toUpperCase();
  return state.rooms[key] ?? null;
}

export function joinRoom(state, { code, userId }) {
  const room = getRoom(state, code);
  if (!room) return { error: 'No encontramos una sala con ese código.' };
  if (!room.participants[userId]) {
    room.participants[userId] = newParticipant(userId);
    if (!room.turnOrder.includes(userId)) room.turnOrder.push(userId);
    if (!room.activeTurnUserId) room.activeTurnUserId = userId;
  }
  const saved = saveState(state);
  return saved.ok ? { room } : { error: 'No se pudo unir a la sala.' };
}

export function listRoomsForUser(state, userId) {
  return Object.values(state.rooms)
    .filter((room) => room.participants[userId])
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function saveRoom(state, room) {
  state.rooms[room.code] = room;
  return saveState(state);
}
