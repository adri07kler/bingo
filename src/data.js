const items = [
  ['coffee', '☕', 'No funciona sin cafe'], ['plant', '🌿', 'Tiene una planta en su escritorio'], ['pet', '🐾', 'Su mascota aparecio en una llamada'], ['playlist', '🎧', 'Trabaja con una playlist'], ['travel', '✈', 'Trabajo desde otra ciudad'],
  ['karaoke', '🎤', 'Fan del karaoke'], ['late', '🌙', 'Da sus mejores ideas de noche'], ['snack', '🍿', 'Siempre tiene un snack cerca'], ['book', '📚', 'Recomendo un libro al equipo'], ['code', '⌨', 'Tiene un atajo de teclado favorito'],
  ['game', '🎮', 'Juega algo despues del trabajo'], ['camera', '📷', 'Colecciona fotos de viajes'], ['free', '✦', 'Espiritu de equipo', true], ['presentation', '✨', 'Disfruta presentar ideas'], ['calendar', '🗓', 'Bloquea tiempo para concentrarse'],
  ['chef', '🍳', 'Cocino algo nuevo este mes'], ['meeting', '🤭', 'Hablo en mute por accidente'], ['language', '💬', 'Esta aprendiendo un idioma'], ['sun', '☀', 'Prefiere empezar temprano'], ['celebrate', '🎉', 'Celebra los pequenos logros'],
  ['walk', '🚶', 'Sale a caminar entre reuniones'], ['idea', '💡', 'Tiene ideas en la ducha'], ['playlist2', '🪩', 'Tiene una cancion para todo'], ['emoji', '🙌', 'Usa muchos emojis en Slack'], ['board', '🧩', 'Ama resolver problemas complejos'],
];

const byId = Object.fromEntries(items.map(([id, icon, label, free]) => [id, { id, icon, label, free }]));
const makeBoard = (id, name, description, ids, accent) => ({ id, name, description, accent, items: ids.map((itemId) => byId[itemId]) });

export const boards = [
  makeBoard('ritual', 'Rituales remotos', 'Para descubrir como fluye el dia de cada persona.', ['coffee', 'plant', 'travel', 'celebrate', 'karaoke', 'pet', 'playlist', 'camera', 'presentation', 'game', 'sun', 'meeting', 'free', 'late', 'chef', 'snack', 'emoji', 'book', 'board', 'calendar', 'walk', 'code', 'language', 'idea', 'playlist2'], 'violet'),
  makeBoard('connection', 'Conexiones inesperadas', 'Intereses, anecdotas y pequenos puntos en comun.', ['karaoke', 'game', 'book', 'camera', 'travel', 'chef', 'playlist2', 'language', 'idea', 'walk', 'pet', 'meeting', 'free', 'plant', 'coffee', 'celebrate', 'presentation', 'board', 'code', 'calendar', 'sun', 'late', 'snack', 'emoji', 'playlist'], 'orange'),
  makeBoard('superpowers', 'Superpoderes de equipo', 'La forma unica en que cada persona aporta al grupo.', ['presentation', 'board', 'code', 'celebrate', 'emoji', 'calendar', 'coffee', 'playlist', 'sun', 'walk', 'idea', 'language', 'free', 'book', 'camera', 'pet', 'plant', 'meeting', 'travel', 'snack', 'karaoke', 'game', 'chef', 'late', 'playlist2'], 'mint'),
];

export const rounds = [
  { question: 'Como empieza tu dia de trabajo?', description: 'Elige el ritual que mas se parece al tuyo.', answers: ['Con una taza de cafe', 'Con musica de fondo', 'Ordenando mis prioridades'], discovery: { headline: '5 companeros prefieren trabajar con musica.', detail: 'Nora compartio que cambia de playlist segun el tipo de tarea.', ids: ['coffee', 'playlist', 'sun', 'late', 'snack'] } },
  { question: 'Que nunca falta cerca de tu compu?', description: 'Tu espacio de trabajo tambien cuenta una historia.', answers: ['Una planta o mascota', 'Algo rico para picar', 'Mis audifonos'], discovery: { headline: '4 companeros tienen plantas como companeras de oficina.', detail: 'Las mascotas tambien se llevaron varios saludos en la videollamada.', ids: ['plant', 'pet', 'meeting', 'emoji', 'calendar'] } },
  { question: 'Fuera del trabajo, que te entusiasma?', description: 'Encuentra afinidades fuera de la pantalla.', answers: ['Explorar lugares nuevos', 'Aprender o crear algo', 'Cantar o jugar'], discovery: { headline: '6 personas encuentran energia al explorar lugares nuevos.', detail: 'Dos ya intercambiaron recomendaciones para su proximo viaje.', ids: ['travel', 'camera', 'walk', 'book', 'language'] } },
  { question: 'Cual es tu superpoder en equipo?', description: 'Todas las respuestas hacen que el equipo funcione.', answers: ['Conectar y celebrar', 'Resolver el desafio dificil', 'Aportar ideas frescas'], discovery: { headline: 'El equipo se reconoce por celebrar los pequenos logros.', detail: 'Leo conto que siempre reserva cinco minutos para compartir avances.', ids: ['celebrate', 'presentation', 'board', 'code', 'idea'] } },
  { question: 'Que momento remoto te representa?', description: 'Las anecdotas de videollamada siempre unen al equipo.', answers: ['Trabajar desde otro lugar', 'La camara se llena de mascotas', 'Compartir una gran idea'], discovery: { headline: '3 companeros ya hablaron en mute por accidente.', detail: 'La anecdota de Isa hizo reir a toda la sala.', ids: ['karaoke', 'game', 'chef', 'playlist2', 'meeting'] } },
];

export const winningLines = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];
