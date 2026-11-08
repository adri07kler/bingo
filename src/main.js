import { boards, rounds } from './data.js';
import { revealOnBoard } from './game.js';
import {
  storageAvailable, loadState, getSessionUser, registerUser, createUser, verifyPin, loginUser, logout,
  createRoom, joinRoom, getRoom, listRoomsForUser, saveRoom, listUsers,
} from './storage.js';
import {
  boardById, initialMarkedForBoard, ensureParticipantBoard, applyDiscoveryToAll,
  recordAnswer, advanceAfterMarked, resetRoomGame, canStartRoom, roomProgress,
} from './room.js';

const app = document.querySelector('#app');
const topbarCenter = document.querySelector('#topbar-center');
const topbarRight = document.querySelector('#topbar-right');

let state = loadState();
let view = { name: 'boot', roomCode: null, authMode: 'login', addMode: 'new', message: null, error: null, viewAsUserId: null, lastAnswer: null };

function persist() {
  const result = saveRoomIfNeeded();
  return result;
}

function saveRoomIfNeeded() {
  if (view.roomCode) {
    const room = getRoom(state, view.roomCode);
    if (room) saveRoom(state, room);
  }
  return state;
}

function currentUser() {
  return getSessionUser(state);
}

function currentRoom() {
  return view.roomCode ? getRoom(state, view.roomCode) : null;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function userName(userId) {
  return state.users[userId]?.name ?? 'Participante';
}

function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase();
}

function colorFor(name) {
  const palette = ['#6253e7', '#f08762', '#5c93d7', '#34a87a', '#d99144', '#e16c9e', '#4f6bd8'];
  let hash = 0;
  for (let i = 0; i < String(name).length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function avatar(name, extra = '') {
  return `<span class="avatar ${extra}" style="background:${colorFor(name)}">${esc(initials(name))}</span>`;
}

function notice() {
  if (view.error) return `<div class="notice is-error" role="alert">${esc(view.error)}</div>`;
  if (view.message) return `<div class="notice is-ok" role="status">${esc(view.message)}</div>`;
  return '';
}

function renderTopbar() {
  const user = currentUser();
  const room = currentRoom();
  if (!user) {
    topbarCenter.innerHTML = '<span class="muted">Juego local en este navegador</span>';
    topbarRight.innerHTML = '';
    return;
  }
  topbarCenter.innerHTML = room
    ? `<span class="live-dot"></span><span>Sala: <strong>${esc(room.name)}</strong> <span class="room-code">${esc(room.code)}</span></span>`
    : `<span>Sesión local activa</span>`;
  topbarRight.innerHTML = `${avatar(user.name)}<span class="profile-name">Hola, ${esc(user.name)}</span><button class="ghost-button small" type="button" data-action="logout">Salir</button>`;
}

function go(next) {
  view = { ...view, message: null, error: null, ...next };
  render();
}

function render() {
  if (!storageAvailable()) view.error = view.error || 'Este navegador no permite guardar datos locales. La sesión no persistirá.';
  const user = currentUser();
  if (!user) view.name = 'auth';
  else if (view.name === 'auth' || view.name === 'boot') view.name = 'lobby';
  if (view.name === 'room' && !currentRoom()) view.name = 'lobby';
  renderTopbar();
  if (view.name === 'auth') return renderAuth();
  if (view.name === 'room') return renderRoom();
  return renderLobby();
}

function renderAuth() {
  const isRegister = view.authMode === 'register';
  app.innerHTML = `<section class="stage auth-stage"><div class="auth-card">
    <p class="eyebrow">Bingo Social local</p>
    <h1>${isRegister ? 'Crea tu cuenta local' : 'Inicia sesión'}</h1>
    <p class="subtitle">Las cuentas y salas se guardan solo en este navegador. El PIN sirve para identificarte en este equipo (no es seguridad real).</p>
    ${notice()}
    <div class="segmented" role="tablist" aria-label="Acceso">
      <button type="button" class="${!isRegister ? 'is-active' : ''}" data-action="auth-mode" data-mode="login">Iniciar sesión</button>
      <button type="button" class="${isRegister ? 'is-active' : ''}" data-action="auth-mode" data-mode="register">Registrarme</button>
    </div>
    <form id="auth-form" class="stack-form">
      <label>Nombre visible<input name="name" autocomplete="nickname" required minlength="2" maxlength="40" placeholder="Ej. Ana" /></label>
      <label>PIN (4 a 6 dígitos)<input name="pin" type="password" inputmode="numeric" pattern="\\d{4,6}" required placeholder="••••" /></label>
      ${isRegister ? '<label>Confirmar PIN<input name="pin2" type="password" inputmode="numeric" pattern="\\d{4,6}" required placeholder="••••" /></label>' : ''}
      <button class="primary-button" type="submit">${isRegister ? 'Crear cuenta local' : 'Entrar'} <span>→</span></button>
    </form>
    ${!isRegister && listUsers(state).length ? `<p class="helper">Cuentas en este navegador: ${listUsers(state).map((u) => esc(u.name)).join(', ')}</p>` : ''}
  </div></section>`;
}

function renderLobby() {
  const user = currentUser();
  const rooms = listRoomsForUser(state, user.id);
  app.innerHTML = `<section class="stage lobby-stage"><div class="stage-intro"><p class="eyebrow">Lobby local</p><h1>Salas de Bingo Social</h1><p class="subtitle">Crea una sala o únete con un código. Todo se guarda en este navegador y pueden participar varias personas pasando el dispositivo.</p></div>
    ${notice()}
    <div class="lobby-grid">
      <section class="panel-card"><p class="eyebrow">Crear sala</p><h2>Nueva ronda para tu equipo</h2>
        <form id="create-room-form" class="stack-form compact"><label>Nombre de la sala<input name="roomName" maxlength="60" placeholder="Ej. Viernes con equipo" value="Sala de ${esc(user.name)}" /></label><button class="primary-button" type="submit">Crear sala <span>→</span></button></form>
      </section>
      <section class="panel-card"><p class="eyebrow">Unirse</p><h2>Entrar con código</h2>
        <form id="join-room-form" class="stack-form compact"><label>Código<input name="code" maxlength="12" placeholder="BINGO-7K2Q" style="text-transform:uppercase" /></label><button class="secondary-button" type="submit">Unirme</button></form>
      </section>
      <section class="panel-card lobby-list"><p class="eyebrow">Mis salas</p><h2>Continuar donde te quedaste</h2>
        ${rooms.length ? `<div class="room-list">${rooms.map((room) => `<button class="room-list-item" type="button" data-action="open-room" data-code="${esc(room.code)}"><span><strong>${esc(room.name)}</strong><small>${esc(room.code)} · ${Object.keys(room.participants).length} participantes</small></span><span>→</span></button>`).join('')}</div>` : '<p class="helper">Aún no participas en ninguna sala.</p>'}
      </section>
    </div></section>`;
}

function roomViewAs(room) {
  const id = view.viewAsUserId && room.participants[view.viewAsUserId] ? view.viewAsUserId : (room.activeTurnUserId || room.turnOrder[0]);
  view.viewAsUserId = id;
  return id;
}

function rosterMarkup(room) {
  return `<div class="roster">${room.turnOrder.map((userId, idx) => {
    const name = userName(userId);
    const p = room.participants[userId];
    const active = room.activeTurnUserId === userId;
    const winner = room.winnerUserId === userId;
    const marks = p.markedIds?.length || 0;
    return `<div class="roster-item ${active ? 'is-active' : ''} ${winner ? 'is-winner' : ''}">${avatar(name)}<div class="roster-main"><strong>${esc(name)}</strong><small>${winner ? 'Ganador' : active ? 'Turno activo' : `Turno ${idx + 1}`} · ${marks}/25</small></div>${p.boardId ? '<span class="badge">Tablero listo</span>' : '<span class="badge warn">Falta tablero</span>'}</div>`;
  }).join('')}</div>`;
}

function boardMarkup(board, participant) {
  if (!board) return `<div class="empty-board">Elige un tablero para ver el progreso.</div>`;
  const marked = new Set(participant?.markedIds?.length ? participant.markedIds : initialMarkedForBoard(board));
  const winning = new Set(participant?.winningLine ?? []);
  return `<div class="bingo-board">${board.items.map((item, index) => `
    <article class="bingo-cell ${marked.has(item.id) ? 'is-marked' : ''} ${winning.has(index) ? 'is-winning' : ''} ${item.free ? 'is-free' : ''}">
      <span class="cell-icon">${item.icon}</span><span class="cell-label">${esc(item.label)}</span><span class="cell-check">✓</span>
    </article>`).join('')}</div>`;
}

function boardOptionsMarkup(room, targetUserId) {
  const participant = room.participants[targetUserId];
  return `<div class="board-options">${boards.map((board) => {
    const selected = participant?.boardId === board.id;
    return `<button class="board-option option-${board.accent} ${selected ? 'is-selected' : ''}" type="button" data-action="pick-board" data-user="${esc(targetUserId)}" data-board="${esc(board.id)}">
      <span class="option-top"><span><span class="option-kicker">TABLERO</span><strong>${esc(board.name)}</strong></span><span class="option-arrow">${selected ? '✓' : '→'}</span></span>
      <span class="option-description">${esc(board.description)}</span></button>`;
  }).join('')}</div>`;
}

function renderRoom() {
  const room = currentRoom();
  const user = currentUser();
  if (!room || !user) return go({ name: 'lobby' });
  if (room.roundPhase === 'result') return renderRoomResult(room);
  const viewId = roomViewAs(room);
  const viewParticipant = room.participants[viewId];
  const viewBoard = boardById(viewParticipant?.boardId);
  const activeName = userName(room.activeTurnUserId);
  const progress = roomProgress(room);
  const activeReady = !!room.participants[room.activeTurnUserId]?.boardId;
  const started = room.roundHistory.length > 0 || room.roundPhase !== 'question';
  const needsSetup = !started && !canStartRoom(room);
  app.innerHTML = `<section class="stage stage-game room-stage">
    <div class="game-heading">
      <div class="round-title"><div><p class="eyebrow">Sala ${esc(room.code)} · ronda ${progress.current} de ${progress.total}</p><h1>${needsSetup ? 'Prepara la sala' : room.winnerUserId ? 'Línea completada' : `Turno de ${esc(activeName)}`}</h1></div>
      <div class="room-actions"><button class="ghost-button small" type="button" data-action="lobby">Lobby</button><button class="ghost-button small" type="button" data-action="copy-code" data-code="${esc(room.code)}">Copiar código</button><button class="ghost-button small" type="button" data-action="reset-room">Nueva ronda</button></div></div>
    </div>
    ${notice()}
    <div class="room-layout">
      <section class="panel-card"><p class="eyebrow">Participantes</p><h2>Ronda compartida, progreso individual</h2>${rosterMarkup(room)}
        <label class="inline-field">Ver tablero de
          <select data-action="view-as">${room.turnOrder.map((id) => `<option value="${esc(id)}" ${id === viewId ? 'selected' : ''}>${esc(userName(id))}</option>`).join('')}</select>
        </label>
        <p class="helper">Pasa el dispositivo: responde por el turno activo. Al aplicar afinidades, cada persona marca según su propio tablero.</p>
        ${addParticipantMarkup(room)}
      </section>
      <section class="board-panel"><div class="panel-heading"><div><p class="eyebrow">Tablero de ${esc(userName(viewId))}</p><h2>${viewBoard ? esc(viewBoard.name) : 'Sin tablero'}</h2></div><span class="progress-pill">${viewParticipant?.markedIds?.length || 0} / 25</span></div>
        ${viewBoard ? boardMarkup(viewBoard, viewParticipant) : `<div class="setup-block"><p>${esc(userName(viewId))} aún no elige tablero.</p>${boardOptionsMarkup(room, viewId)}</div>`}
      </section>
      <aside class="round-panel">${needsSetup ? setupMarkup(room) : !activeReady && room.roundPhase === 'question' ? activeNeedsBoardMarkup(room) : roundMarkup(room)}</aside>
    </div></section>`;
}

function addParticipantMarkup(room) {
  const available = listUsers(state).filter((u) => !room.participants[u.id]);
  const isNew = view.addMode !== 'existing';
  return `<div class="add-participant"><p class="eyebrow">Agregar participante</p>
    <div class="segmented small" role="tablist" aria-label="Agregar participante">
      <button type="button" class="${isNew ? 'is-active' : ''}" data-action="add-mode" data-mode="new">Cuenta nueva</button>
      <button type="button" class="${!isNew ? 'is-active' : ''}" data-action="add-mode" data-mode="existing">Ya existe</button>
    </div>
    ${isNew ? `<form id="add-new-form" class="stack-form compact">
      <label>Nombre visible<input name="name" required minlength="2" maxlength="40" placeholder="Ej. Ana" /></label>
      <label>PIN (4 a 6 dígitos)<input name="pin" type="password" inputmode="numeric" pattern="\\d{4,6}" required placeholder="••••" /></label>
      <label>Confirmar PIN<input name="pin2" type="password" inputmode="numeric" pattern="\\d{4,6}" required placeholder="••••" /></label>
      <button class="secondary-button" type="submit">Crear y agregar a la sala</button>
    </form>` : available.length ? `<form id="add-existing-form" class="stack-form compact">
      <label>Cuenta en este navegador<select name="userId" required>${available.map((u) => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('')}</select></label>
      <label>PIN de esa cuenta<input name="pin" type="password" inputmode="numeric" pattern="\\d{4,6}" required placeholder="••••" /></label>
      <button class="secondary-button" type="submit">Confirmar y agregar</button>
    </form>` : `<p class="helper">No hay otras cuentas registradas en este navegador. Usa “Cuenta nueva”.</p>`}
    <p class="helper">No cambia tu sesión. Las cuentas agregadas solo existen en este navegador.</p>
  </div>`;
}

function setupMarkup(room) {
  const missing = room.turnOrder.filter((id) => !room.participants[id]?.boardId).map(userName);
  return `<section class="question-card setup-card"><p class="eyebrow">Antes de jugar</p><h2>Cada participante elige su tablero</h2><p class="question-copy">Comparte el dispositivo para que cada persona elija. ${missing.length ? `Falta: ${esc(missing.join(', '))}.` : 'Todo listo.'}</p>
    <p class="response-note">Usa “Ver tablero de” para cambiar de participante y asignar su tablero.</p></section>`;
}

function activeNeedsBoardMarkup(room) {
  const id = room.activeTurnUserId;
  view.viewAsUserId = id;
  return `<section class="question-card setup-card"><p class="eyebrow">Turno de ${esc(userName(id))}</p><h2>Falta elegir tablero</h2><p class="question-copy">Antes de responder, ${esc(userName(id))} debe elegir un tablero.</p>${boardOptionsMarkup(room, id)}</section>`;
}

function roundMarkup(room) {
  const round = rounds[room.roundIndex];
  const activeName = userName(room.activeTurnUserId);
  if (!round) return `<section class="question-card"><h2>Sin más preguntas</h2><button class="primary-button" type="button" data-action="finish-no-winner">Ver resultado <span>→</span></button></section>`;
  if (room.roundPhase === 'discovery') return discoveryMarkup(room, round, activeName);
  if (room.roundPhase === 'marked') return markedMarkup(room, round);
  return `<section class="question-card"><div class="question-topline"><span class="question-counter">Turno de ${esc(activeName)}</span><span class="sparkle">?</span></div><p class="eyebrow">Pregunta compartida</p><h2>${esc(round.question)}</h2><p class="question-copy">${esc(round.description)}</p><div class="answer-list">${round.answers.map((answer, index) => `<button class="answer-button" type="button" data-action="answer" data-index="${index}"><span>${esc(answer)}</span><span class="answer-arrow">→</span></button>`).join('')}</div><p class="response-note">Responde como ${esc(activeName)}. Luego el descubrimiento se aplicará a todos según su tablero.</p></section>`;
}

function discoveryMarkup(room, round, activeName) {
  const last = room.roundHistory.at(-1);
  const answer = last ? round.answers[last.answerIndex] : view.lastAnswer;
  return `<section class="discovery-card"><span class="discovery-orb">🔎</span><p class="eyebrow">Descubrimiento de la ronda</p><h2>${esc(round.discovery.headline)}</h2><p>${esc(round.discovery.detail)}</p><div class="selected-answer"><span>Respuesta de ${esc(activeName)}</span><strong>${esc(answer ?? '')}</strong></div><button class="primary-button" type="button" data-action="apply-discovery">Aplicar afinidades a todos <span>→</span></button></section>`;
}

function markedMarkup(room, round) {
  const viewId = roomViewAs(room);
  const board = boardById(room.participants[viewId]?.boardId);
  let matchCount = 0;
  if (board) {
    const before = new Set(room.participants[viewId].markedIds);
    // approximation not stored; show current board context
    matchCount = (round.discovery.ids || []).filter((id) => board.items.some((it) => it.id === id)).length;
    void before;
  }
  return `<section class="marked-card"><span class="marked-icon">✦</span><p class="eyebrow">Afinidades aplicadas</p><h2>Progreso actualizado para la sala</h2><p>${esc(userName(viewId))} tiene ${matchCount} afinidad(es) de esta ronda en su tablero (si estaban disponibles). Cambia “Ver tablero de” para revisar a otros.</p><div class="discovery-mini"><span>🔎</span><span>${esc(round.discovery.headline)}</span></div><button class="primary-button" type="button" data-action="next-turn">${room.winnerUserId || room.roundIndex >= rounds.length - 1 ? 'Ver resultado' : 'Siguiente turno'} <span>→</span></button></section>`;
}

function renderRoomResult(room) {
  const winner = room.winnerUserId ? state.users[room.winnerUserId] : null;
  const discoveries = room.roundHistory.map((h) => rounds[h.roundIndex]).filter(Boolean);
  app.innerHTML = `<section class="stage stage-result"><div class="result-card"><div class="trophy">🏆</div><p class="eyebrow">Ronda terminada</p><h1>${winner ? `Bingo, ${esc(winner.name)}!` : 'Sin bingo esta vez'}</h1><p class="result-lead">${winner ? `${esc(winner.name)} completó una línea en su tablero.` : 'Se terminaron las preguntas. Aun así, el equipo descubrió conexiones valiosas.'}</p>
    ${winner ? `<div class="winner-row">${avatar(winner.name)}<span><strong>${esc(winner.name)}</strong><small>Ganador de la ronda</small></span><span class="winner-badge">BINGO</span></div>` : ''}
    <div class="result-discoveries"><p class="eyebrow">Lo que descubrimos</p>${discoveries.slice(0, 4).map((round) => `<p><span>✦</span>${esc(round.discovery.headline)}</p>`).join('') || '<p>Sin descubrimientos registrados.</p>'}</div>
    <div class="result-actions"><button class="primary-button" type="button" data-action="reset-room">Nueva ronda <span>→</span></button><button class="secondary-button" type="button" data-action="lobby">Volver al lobby</button></div></div></section>`;
}

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id === 'auth-form') {
    event.preventDefault();
    const data = new FormData(form);
    const payload = { name: data.get('name'), pin: data.get('pin') };
    if (view.authMode === 'register') {
      if (data.get('pin') !== data.get('pin2')) return go({ error: 'Los PIN no coinciden.' });
      const result = registerUser(state, payload);
      if (result.error) return go({ error: result.error });
      return go({ name: 'lobby', message: `Cuenta creada. Hola, ${result.user.name}.` });
    }
    const result = loginUser(state, payload);
    if (result.error) return go({ error: result.error });
    return go({ name: 'lobby', message: `Bienvenido, ${result.user.name}.` });
  }
  if (form.id === 'create-room-form') {
    event.preventDefault();
    const user = currentUser();
    const roomName = new FormData(form).get('roomName');
    const result = createRoom(state, { name: roomName, hostUserId: user.id });
    if (result.error) return go({ error: result.error });
    return go({ name: 'room', roomCode: result.room.code, viewAsUserId: user.id, message: `Sala creada: ${result.room.code}` });
  }
  if (form.id === 'join-room-form') {
    event.preventDefault();
    const user = currentUser();
    const code = new FormData(form).get('code');
    const result = joinRoom(state, { code, userId: user.id });
    if (result.error) return go({ error: result.error });
    return go({ name: 'room', roomCode: result.room.code, viewAsUserId: user.id, message: `Te uniste a ${result.room.code}.` });
  }
  if (form.id === 'add-new-form') {
    event.preventDefault();
    const room = currentRoom();
    if (!room) return;
    const data = new FormData(form);
    if (data.get('pin') !== data.get('pin2')) return go({ error: 'Los PIN no coinciden.' });
    const created = createUser(state, { name: data.get('name'), pin: data.get('pin') });
    if (created.error) return go({ error: created.error });
    const joined = joinRoom(state, { code: room.code, userId: created.user.id });
    if (joined.error) return go({ error: joined.error });
    saveRoom(state, joined.room);
    return go({ viewAsUserId: created.user.id, message: `${created.user.name} se agregó a la sala. Ahora debe elegir su tablero.` });
  }
  if (form.id === 'add-existing-form') {
    event.preventDefault();
    const room = currentRoom();
    if (!room) return;
    const data = new FormData(form);
    const userId = String(data.get('userId') || '');
    if (!state.users[userId]) return go({ error: 'Selecciona una cuenta válida.' });
    if (room.participants[userId]) return go({ error: 'Esa cuenta ya está en la sala.' });
    if (!verifyPin(state, userId, data.get('pin'))) return go({ error: 'PIN incorrecto para esa cuenta.' });
    const joined = joinRoom(state, { code: room.code, userId });
    if (joined.error) return go({ error: joined.error });
    saveRoom(state, joined.room);
    return go({ viewAsUserId: userId, message: `${userName(userId)} se agregó a la sala.` });
  }
});

document.addEventListener('change', (event) => {
  const select = event.target.closest('select[data-action="view-as"]');
  if (!select) return;
  view.viewAsUserId = select.value;
  render();
});

app.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-action]') : null;
  if (!target) return;
  const action = target.getAttribute('data-action');
  if (action === 'auth-mode') return go({ authMode: target.getAttribute('data-mode') || 'login' });
  if (action === 'add-mode') return go({ addMode: target.getAttribute('data-mode') || 'new' });
  if (action === 'logout') { logout(state); return go({ name: 'auth', roomCode: null, message: 'Sesión cerrada en este navegador.' }); }
  if (action === 'lobby') return go({ name: 'lobby', roomCode: null });
  if (action === 'copy-code') {
    const code = target.getAttribute('data-code') || '';
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).catch(() => {});
    return go({ message: `Código ${code} listo para compartir (solo funciona en este navegador).` });
  }
  if (action === 'open-room') return go({ name: 'room', roomCode: target.getAttribute('data-code'), viewAsUserId: currentUser()?.id });
  if (action === 'pick-board') {
    const room = currentRoom();
    if (!room) return;
    ensureParticipantBoard(room, target.getAttribute('data-user'), target.getAttribute('data-board'));
    saveRoom(state, room);
    return go({ viewAsUserId: target.getAttribute('data-user'), message: 'Tablero guardado.' });
  }
  if (action === 'answer') {
    const room = currentRoom();
    if (!room) return;
    const index = Number(target.getAttribute('data-index'));
    view.lastAnswer = rounds[room.roundIndex].answers[index];
    recordAnswer(room, { activeUserId: room.activeTurnUserId, answerIndex: index, revealedIds: rounds[room.roundIndex].discovery.ids });
    saveRoom(state, room);
    return go({});
  }
  if (action === 'apply-discovery') {
    const room = currentRoom();
    if (!room) return;
    applyDiscoveryToAll(room, rounds[room.roundIndex].discovery.ids);
    room.roundPhase = 'marked';
    saveRoom(state, room);
    return go({ message: room.winnerUserId ? `${userName(room.winnerUserId)} completó una línea.` : null });
  }
  if (action === 'next-turn' || action === 'finish-no-winner') {
    const room = currentRoom();
    if (!room) return;
    if (action === 'finish-no-winner') room.roundPhase = 'result';
    else advanceAfterMarked(room);
    saveRoom(state, room);
    return go({});
  }
  if (action === 'reset-room') {
    const room = currentRoom();
    if (!room) return;
    resetRoomGame(room);
    saveRoom(state, room);
    return go({ message: 'Nueva ronda lista. Los tableros se conservan.' });
  }
});

topbarRight.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target.closest('[data-action]') : null;
  if (target?.getAttribute('data-action') === 'logout') { logout(state); go({ name: 'auth', roomCode: null, message: 'Sesión cerrada en este navegador.' }); }
});

document.querySelector('[data-nav="lobby"]')?.addEventListener('click', (event) => {
  if (currentUser()) { event.preventDefault(); go({ name: 'lobby', roomCode: null }); }
});

render();
