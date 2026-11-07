import { boards, rounds } from './data.js';
import { createGame } from './game.js';

const app = document.querySelector('#app');
let selectedBoard = null;
let game = null;
let roundIndex = 0;
let phase = 'question';
let selectedAnswer = null;
let discoveries = [];

function boardMarkup(board, compact = false) {
  return `<div class="bingo-board ${compact ? 'is-compact' : ''}">${board.items.map((item, index) => `
    <article class="bingo-cell ${game?.isMarked(item.id) ? 'is-marked' : ''} ${game?.isWinningPosition(index) ? 'is-winning' : ''} ${item.free ? 'is-free' : ''}">
      <span class="cell-icon">${item.icon}</span><span class="cell-label">${item.label}</span><span class="cell-check">✓</span>
    </article>`).join('')}</div>`;
}

function progressMarkup(step) {
  return `<ol class="flow-steps"><li class="${step >= 1 ? 'is-active' : ''}"><span>1</span> Elige tablero</li><li class="${step >= 2 ? 'is-active' : ''}"><span>2</span> Juega y descubre</li><li class="${step >= 3 ? 'is-active' : ''}"><span>3</span> Resultado</li></ol>`;
}

function renderSelection() {
  app.innerHTML = `<section class="stage stage-selection"><div class="stage-intro">${progressMarkup(1)}<p class="eyebrow">Antes de empezar</p><h1>Elige tu tablero de afinidades</h1><p class="subtitle">Cada tablero revela conexiones distintas. La cuadrícula que elijas te acompanara durante toda la ronda.</p></div><div class="board-options">${boards.map((board) => `
    <button class="board-option option-${board.accent}" type="button" data-board="${board.id}"><span class="option-top"><span><span class="option-kicker">TABLERO</span><strong>${board.name}</strong></span><span class="option-arrow">→</span></span>${boardMarkup(board, true)}<span class="option-description">${board.description}</span></button>`).join('')}</div></section>`;
}

function renderGame() {
  const round = rounds[roundIndex];
  const isDiscovery = phase === 'discovery';
  const isMarked = phase === 'marked';
  app.innerHTML = `<section class="stage stage-game"><div class="game-heading">${progressMarkup(2)}<div class="round-title"><div><p class="eyebrow">Bingo social · ronda ${String(roundIndex + 1).padStart(2, '0')}</p><h1>${isDiscovery ? 'Pausa para descubrir' : isMarked ? 'Afinidades marcadas' : 'Conozcamos al equipo'}</h1></div><div class="game-meta"><span class="avatar avatar-nora">N</span><span class="avatar avatar-leo">L</span><span class="avatar avatar-isa">I</span><span>12 personas jugando</span></div></div></div>
    <div class="game-layout"><section class="board-panel"><div class="panel-heading"><div><p class="eyebrow">Tu cuadrícula</p><h2>${selectedBoard.name}</h2></div><span class="progress-pill">${game.markedCount()} / 25 descubiertas</span></div>${boardMarkup(selectedBoard)}<p class="board-hint">✦ Las afinidades del equipo se iluminan despues de cada descubrimiento.</p></section>
    <aside class="round-panel">${isDiscovery ? discoveryMarkup(round) : isMarked ? markedMarkup(round) : questionMarkup(round)}</aside></div></section>`;
}

function questionMarkup(round) {
  return `<section class="question-card"><div class="question-topline"><span class="question-counter">Pregunta ${roundIndex + 1} de ${rounds.length}</span><span class="sparkle">?</span></div><p class="eyebrow">Pregunta actual</p><h2>${round.question}</h2><p class="question-copy">${round.description}</p><div class="answer-list">${round.answers.map((answer, index) => `<button class="answer-button" type="button" data-answer="${index}"><span>${answer}</span><span class="answer-arrow">→</span></button>`).join('')}</div><p class="response-note">12 respuestas recibidas · elige la que mas te representa</p></section>`;
}

function discoveryMarkup(round) {
  return `<section class="discovery-card"><span class="discovery-orb">🔎</span><p class="eyebrow">Descubrimiento de la ronda</p><h2>${round.discovery.headline}</h2><p>${round.discovery.detail}</p><div class="selected-answer"><span>Tu respuesta</span><strong>${selectedAnswer}</strong></div><button class="primary-button" id="reveal-cells" type="button">Ver afinidades en mi tablero <span>→</span></button></section>`;
}

function markedMarkup(round) {
  const matchCount = discoveries.at(-1).matched.length;
  return `<section class="marked-card"><span class="marked-icon">✦</span><p class="eyebrow">Conexion encontrada</p><h2>${matchCount ? `${matchCount} afinidades de tu tablero coinciden` : 'Esta vez no hubo coincidencias en tu tablero'}</h2><p>Lo importante es la conversacion: ahora saben un poco mas sobre las personas que hacen equipo cada dia.</p><div class="discovery-mini"><span>🔎</span><span>${round.discovery.headline}</span></div><button class="primary-button" id="next-round" type="button">${roundIndex === rounds.length - 1 ? 'Ver resultado de la ronda' : 'Siguiente pregunta'} <span>→</span></button></section>`;
}

function renderResult(winner = 'Leo') {
  const personalWin = winner === 'Camila';
  app.innerHTML = `<section class="stage stage-result"><div class="result-card"><div class="trophy">🏆</div><p class="eyebrow">Ronda terminada</p><h1>${personalWin ? 'Bingo, Camila!' : `${winner} completo el Bingo`}</h1><p class="result-lead">${personalWin ? 'Tu tablero se completo gracias a las afinidades que descubriste con el equipo.' : 'La sala celebro una nueva linea completa. Las conexiones siguen siendo de todos.'}</p><div class="winner-row"><span class="avatar ${personalWin ? 'avatar-camila' : 'avatar-leo'}">${personalWin ? 'C' : 'L'}</span><span><strong>${winner}</strong><small>Ganador de la ronda</small></span><span class="winner-badge">BINGO</span></div><div class="result-discoveries"><p class="eyebrow">Lo que descubrimos</p>${discoveries.slice(0, 3).map(({ round }) => `<p><span>✦</span>${round.discovery.headline}</p>`).join('')}</div><p class="integration-message">Cuando compartimos pequenas historias, la comunicacion se vuelve mas cercana. Hoy el equipo encontro intereses en comun y nuevas formas de conocerse mas alla de las tareas.</p><button class="primary-button" id="play-again" type="button">Elegir otro tablero <span>→</span></button></div></section>`;
}

function chooseBoard(boardId) {
  selectedBoard = boards.find((board) => board.id === boardId);
  game = createGame(selectedBoard);
  roundIndex = 0;
  phase = 'question';
  discoveries = [];
  renderGame();
}

app.addEventListener('click', (event) => {
  const boardButton = event.target.closest('[data-board]');
  if (boardButton) return chooseBoard(boardButton.dataset.board);
  const answerButton = event.target.closest('[data-answer]');
  if (answerButton) { selectedAnswer = rounds[roundIndex].answers[Number(answerButton.dataset.answer)]; phase = 'discovery'; return renderGame(); }
  if (event.target.closest('#reveal-cells')) {
    const round = rounds[roundIndex];
    const result = game.reveal(round.discovery.ids);
    discoveries.push({ round, ...result });
    phase = 'marked';
    return renderGame();
  }
  if (event.target.closest('#next-round')) {
    if (discoveries.at(-1).hasWinner) return renderResult('Camila');
    if (roundIndex === rounds.length - 1) return renderResult('Leo');
    roundIndex += 1;
    phase = 'question';
    return renderGame();
  }
  if (event.target.closest('#play-again')) renderSelection();
});

renderSelection();
