# 🎯 Bingo Social

**Bingo Social** es una aplicación web diseñada para fomentar la interacción, la comunicación y la integración entre colaboradores de equipos remotos.

A través de una dinámica inspirada en el Bingo, los participantes responden preguntas sobre intereses, preferencias y experiencias. 
Durante el juego, los jugadores descubren nuevas cosas sobre sus compañeros mientras completan su tablero de afinidades.

## ✨ Objetivo

El objetivo principal no es únicamente encontrar un ganador, sino crear un espacio de interacción donde los integrantes de un equipo puedan:

- 🤝 Conocerse mejor.
- 💬 Fomentar la comunicación.
- 🔎 Descubrir intereses y preferencias en común.
- 🎉 Participar en una actividad divertida de integración.

## 🎮 ¿Cómo funciona?

El juego está dividido en tres etapas principales:

### 1️⃣ Selección de cuadrícula

Cada participante selecciona un tablero de Bingo de **5×5** con diferentes afinidades, características y situaciones.

Cada tablero cuenta con una combinación distinta, que acompañará al jugador durante toda la partida.

### 2️⃣ Juego por rondas

El juego presenta preguntas cerradas relacionadas con situaciones:

- 😄 Divertidas.
- 💼 Profesionales.
- 👤 Personales.
- 🎯 Intereses y preferencias.

Cada ronda sigue la siguiente dinámica:

```text
❓ Pregunta
   ↓
🗳️ Respuestas
   ↓
🔎 Descubrimiento
   ↓
✨ Marcado de casillas
   ↓
➡️ Siguiente pregunta
```

Después de cada pregunta se muestra un momento de **Descubrimiento**, donde los participantes pueden conocer los resultados y 
descubrir características o preferencias de sus compañeros.

Si un descubrimiento coincide con una afinidad del tablero del jugador, la casilla correspondiente se marca.

### 3️⃣ Resultado final

Cuando un jugador completa una fila, columna o diagonal, se declara un ganador.

Al finalizar, el juego muestra un resumen de los principales descubrimientos realizados durante la actividad, reforzando el objetivo de conocer mejor al equipo.

Ejemplo:

> 🏆 Ganador: Ana
>
> Durante el juego descubrimos que:
>
> - 🎵 5 compañeros prefieren trabajar con música.
> - 🐶 3 personas tienen mascotas.
> - ✈️ 4 integrantes quieren viajar a otro país.

## 🧩 Estado actual

Versión funcional **local** (sin backend/base de datos): las cuentas y salas se guardan en `localStorage` **solo en este navegador/equipo**.

Incluye:

- [x] Registro e inicio de sesión local (nombre + PIN de 4–6 dígitos). El PIN solo identifica la cuenta en este navegador; **no es seguridad real**.
- [x] Crear sala y unirse por código, con roster de participantes persistente.
- [x] Juego “pasa el dispositivo”: turno por participante activo, rondas compartidas y **progreso/marcado independiente** según el tablero de cada persona.
- [x] Cada participante elige su propio tablero 5×5.
- [x] Preguntas, descubrimiento, marcado visual, detección de líneas y resultado.
- [x] Persistencia local al recargar (mismo navegador).

> Importante: no hay sincronización entre dispositivos. Para registro/salas compartidas entre varias personas en distintos dispositivos se requiere un backend (p. ej. Supabase/Firebase/API).

## 🛠️ Tecnologías

Aplicación web estática: HTML, CSS y JavaScript (ES modules). Persistencia local con `localStorage`. Sin dependencias ni servidor.

## ▶️ Cómo usarlo (local)

1. Abre `index.html` en un navegador moderno (o sirve la carpeta con un servidor estático local para evitar restricciones de módulos, p. ej. `npx serve .` si tienes Node).
2. Registra cuentas (nombre + PIN).
3. Crea una sala o únete con el código; agrega participantes iniciando sesión con su cuenta en este navegador.
4. Cada participante elige su tablero y juegan por turnos pasando el dispositivo.
## 💡 Visión del proyecto

Bingo Social busca transformar una actividad tradicional de integración en una experiencia digital diseñada para equipos que trabajan de manera remota.

## La idea central es sencilla:

No se trata solo de completar un tablero, sino de descubrir a las personas que forman parte del equipo.
Desarrollado como un proyecto experimental para explorar nuevas formas de interacción e integración en equipos de trabajo virtuales.

