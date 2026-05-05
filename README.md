# `<qp-game-of-life>` — Conway's Game of Life

Conway's Game of Life as a Web Component, rendered as a CSS Grid of cell DOM
nodes inside a Shadow DOM. The simulation runs at a fixed interval, applies
Conway's rules each tick, and detects cycles (still-life and oscillators) to
end the game. A 3×5 bitmap font lets you seed the board with arbitrary text;
the painted text dissolves into Conway's chaos as the game ticks.

**[Live Demo](https://quaese.github.io/QP-GameOfLife-WebComponent/)**

## Table of Contents

- [`<qp-game-of-life>` — Conway's Game of Life](#qp-game-of-life--conways-game-of-life)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
  - [Attributes](#attributes)
  - [Game States](#game-states)
  - [Public Methods](#public-methods)
  - [Events](#events)
  - [Game Flow](#game-flow)
  - [Cycle Detection](#cycle-detection)
  - [Bitmap Font](#bitmap-font)
  - [UI Sections](#ui-sections)
  - [Lifecycle](#lifecycle)
  - [File Structure](#file-structure)

## Usage

```html
<!-- Default: 20px cells, 500ms interval -->
<qp-game-of-life style="width: 100%; height: 30vh;"></qp-game-of-life>

<!-- Smaller cells, faster ticks -->
<qp-game-of-life
  style="width: 100%; height: 30vh;"
  cell-size="15"
  interval="100"
></qp-game-of-life>
```

```html
<script type="module" src="/js/components-web/qp-game-of-life/qp-game-of-life.wc.js"></script>
```

The element does **not** auto-start. After load it shows the `qp-game-of-life`
logo as the resting state — the user must trigger `start()` (or any other
lifecycle method) explicitly.

## Attributes

**`cell-size`** (number, default: `20`)

- Side length of a cell in pixels. The grid count is computed by dividing the
  host's content box by `cell-size` and rounding down. Surplus pixels remain
  as empty space inside the board border.

**`interval`** (number, default: `500`)

- Tick interval in milliseconds. Lower values produce faster simulations.

## Game States

The current state is exposed as a read-only `gameState` property and emitted
on every transition via the `qp-game-of-life:statechange` event.

| State      | Description                                                 |
| ---------- | ----------------------------------------------------------- |
| `init`     | Initial state after component load, shows the logo seed     |
| `started`  | Simulation timer is running                                 |
| `paused`   | Timer halted, resumable via `continue()`                    |
| `stopped`  | Simulation halted (board may still show last pattern)       |
| `gameover` | Cycle detected (still-life or oscillator); overlay is shown |

## Public Methods

| Method            | Effect                                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `start()`         | Starts the loop. From `init` keeps the existing pattern (the logo) as seed; otherwise re-paints the stored text seed if any, else randomizes.                                                 |
| `pause()`         | Halts the timer. Transitions to `paused`.                                                                                                                                                     |
| `continue()`      | Resumes a paused simulation. No-op outside of `paused`.                                                                                                                                       |
| `stop()`          | Halts the timer; the current pattern stays visible. Transitions to `stopped`.                                                                                                                 |
| `reset()`         | Halts, clears the board, and clears the stored text seed. Transitions to `stopped`.                                                                                                           |
| `randomize()`     | Replaces state with a uniformly random pattern. Clears the stored text seed.                                                                                                                  |
| `showText(text?)` | Paints `text` (default `"qp-game-of-life"`) onto the board using the 3×5 font. Stores the text as preferred seed for the next `start()`. Falls back to `randomize()` if the text doesn't fit. |
| `randomText()`    | Picks a random word from the imported `WORDS` pool and calls `showText()`.                                                                                                                    |

The text seed (`#text`) is the **preferred seed for the next `start()`**:

- Set by `showText()` (and indirectly by `randomText()`)
- Cleared by `randomize()` and `reset()`

## Events

**`qp-game-of-life:statechange`**

`CustomEvent` with `bubbles: true` and `composed: true` (crosses Shadow DOM).
Fired on every state transition. No-op events (re-setting the same state) are
suppressed.

- `detail: { previousState, currentState }`

```js
const game = document.querySelector('qp-game-of-life');

game.addEventListener('qp-game-of-life:statechange', (e) => {
  console.log(`${e.detail.previousState} → ${e.detail.currentState}`);

  if (e.detail.currentState === 'gameover') {
    // Custom logic on game over (overlay is already shown by the WC).
  }
});
```

## Game Flow

1. Component loads in **init** state. The board displays the
   `qp-game-of-life` logo painted via the bitmap font; the timer is **not**
   running.
2. The user calls `start()`. From the `init` state the logo is preserved as
   the seed and dissolves into Conway's chaos with each tick. From any other
   state, the stored text seed (if any) is repainted, otherwise the board is
   re-randomized.
3. The simulation ticks at the configured `interval`. Each tick computes the
   next generation per Conway's rules and applies a minimal DOM diff.
4. When a cycle is detected (still-life or oscillator), the simulation stops
   and the **gameover overlay** appears with two actions:
   - **Restart** — hides the overlay and starts a fresh game.
   - **Close** — hides the overlay; `gameState` stays `gameover`.
5. The user can interrupt at any time:
   - `pause()` to halt and resume later via `continue()`.
   - `stop()` to halt while keeping the pattern visible.
   - `reset()` to wipe the board and clear the seed memory.
   - `randomize()` / `showText()` / `randomText()` to set a new seed.

## Cycle Detection

After each tick the new state is hashed (`"01001|10110|…"` — one row per
segment) and compared against an in-memory history of the last
`MAX_HISTORY` (default 20) hashes. A match means the simulation has entered
a cycle, which covers:

- **Still-life** (period 1) — block, beehive, loaf, …
- **Oscillators** (period 2 to ~19) — blinker, toad, beacon, pulsar, …

Gliders and spaceships are **not** detected because their hash translates
across the grid each tick.

The history is cleared on `randomize()`, `reset()`, and on every successful
`showText()` (handled internally) so a new run is never matched against the
previous game.

## Bitmap Font

`font_3x5.js` exports a frozen lowercase bitmap font:

- 3 columns × 5 rows per glyph
- `#` = live, `.` = dead
- Covers `a–z`, `0–9`, `-`, `.`, ` ` (space)

```js
import FONT_3X5, {
  FONT_3X5_CHAR_WIDTH,    // 3
  FONT_3X5_CHAR_HEIGHT,   // 5
} from "./font_3x5.js";
```

`showText(text)` lowercases the input before lookup, so any casing works.
Unsupported characters are skipped silently. A line of N characters renders
to `N × (3 + 1) − 1` cells wide (3 wide + 1 spacing). When that width or 5
rows exceeds the grid, the call falls back to `randomize()`.

`words.js` exports a curated `WORDS` pool used by `randomText()` —
Game-of-Life themed entries (`conway`, `glider`, `pulsar`, `oscillator`, …).

## UI Sections

- **Board** — CSS Grid sized via `--size-x`/`--size-y`/`--cell-size`/`--width`/`--height`
  custom properties (set on `:host` so siblings can consume them too)
- **Cells** — one `<div class="qp-cell">` per grid position; toggled
  `is-alive` via class
- **Game-over overlay** — absolutely positioned within the board's content
  box; uses `--width`/`--height`/`--border-width` from `:host` so its size
  follows the board exactly. Two action buttons:
  - **Restart** — hides overlay, calls `game.start()`
  - **Close** — hides overlay only

## Lifecycle

**`connectedCallback`**

- Builds the Shadow DOM (style, host div, overlay), wires up overlay actions
  and the `statechange` listener, then instantiates the simulation. Idempotent
  — re-attaching does not recreate the game.

**`disconnectedCallback`**

- Calls the simulation's `destroy()` which clears the timer and removes the
  global `window.resize` listener.

## File Structure

```text
qp-game-of-life/
  qp-game-of-life.wc.js     — Web Component (Shadow DOM, overlay, delegates)
  qp-game-of-life.class.js  — Simulation class (state, ticking, cycle detection)
  font_3x5.js               — 3×5 bitmap font (a–z, 0–9, punctuation)
  words.js                  — Curated word pool for randomText()
```
