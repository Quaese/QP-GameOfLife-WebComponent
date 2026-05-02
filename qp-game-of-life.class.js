import FONT_3X5, { FONT_3X5_CHAR_WIDTH, FONT_3X5_CHAR_HEIGHT } from "./font_3x5.js";

/**
 * Conway's Game of Life simulation.
 *
 * Renders a configurable cell grid into a host element and runs the cellular
 * automaton on a fixed interval. Cycle detection covers still-life (period 1)
 * and oscillators up to {@link GameOfLife.MAX_HISTORY} steps; gliders/spaceships
 * are not detected since their hash translates over time.
 *
 * @fires qp-game-of-life:statechange - When `gameState` transitions.
 *   `event.detail` is `{ previousState, currentState }`. The event bubbles and
 *   crosses shadow DOM boundaries (`composed: true`).
 */
class GameOfLife {
  /** Debounce delay (ms) for the window resize handler. */
  static DELAY = 200;

  /** Maximum number of past states retained for cycle detection. */
  static MAX_HISTORY = 20;

  /**
   * Lifecycle states emitted via the `qp-game-of-life:statechange` event.
   * @readonly
   * @enum {string}
   */
  static GameState = Object.freeze({
    INIT: "init",
    STARTED: "started",
    PAUSED: "paused",
    STOPPED: "stopped",
    GAMEOVER: "gameover",
  });


  /** @type {() => void} Bound debounced resize handler, cached for removal. */
  #hResize;

  /**
   * @type {string | null} Last text painted via {@link showText}. Acts as the
   * preferred seed for the next {@link start}. Cleared by {@link randomize}
   * and {@link reset}.
   */
  #text = null;

  /**
   * @param {object} options
   * @param {HTMLElement} options.game - Host element that receives the cell grid.
   * @param {number} [options.cellSize=20] - Cell side length in pixels.
   * @param {number} [options.interval=500] - Tick interval in milliseconds.
   */
  constructor(options) {
    if (!options.game) return;

    this.game = options.game;
    this.gameWidth = this.game.offsetWidth;
    this.gameHeight = this.game.offsetHeight;

    this.cellSize = options.cellSize || 20;

    this.state = [];
    this.gameSize = { x: 0, y: 0 };
    this.history = [];

    this.interval = options.interval || 500;
    this.timer = null;
    this.gameState = GameOfLife.GameState.INIT;

    this.#hResize = this.#debounce(() => this.#handleResize(), GameOfLife.DELAY);

    this.#init();
  }

  /**
   * Updates `gameState` and emits `qp-game-of-life:statechange`. No-op when
   * the requested state equals the current one (avoids redundant events).
   * @param {string} newState - One of {@link GameOfLife.GameState}.
   */
  #setGameState(newState) {
    if (this.gameState === newState) return;

    const previousState = this.gameState;
    this.gameState = newState;

    this.game.dispatchEvent(
      new CustomEvent("qp-game-of-life:statechange", {
        bubbles: true,
        composed: true,
        detail: { previousState, currentState: newState },
      }),
    );
  }

  /**
   * Bootstraps the grid, registers the resize listener, and paints the
   * `qp-game-of-life` logo as the resting state. The simulation does not
   * auto-start — the user must trigger {@link start}, {@link continue}, or
   * another lifecycle method.
   */
  #init() {
    window.addEventListener("resize", this.#hResize);

    this.#setGameSize();
    this.#render();
    this.#setNodes();

    this.showText();
  }

  /** Pauses the simulation and removes the global resize listener. */
  destroy() {
    this.pause();
    window.removeEventListener("resize", this.#hResize);
  }

  /**
   * Returns a debounced version of `fn`. Calls within `delay` ms reset the timer.
   * @template {(...args: unknown[]) => void} F
   * @param {F} fn
   * @param {number} delay - Debounce window in milliseconds.
   * @returns {() => void}
   */
  #debounce(fn, delay) {
    let timer;

    return () => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(fn, delay);
    };
  }

  /**
   * Recomputes grid dimensions after a viewport change and re-renders.
   * Preserves the running/paused state — if the simulation was running, it is
   * resumed after the rebuild.
   */
  #handleResize() {
    this.gameWidth = this.game.offsetWidth;
    this.gameHeight = this.game.offsetHeight;

    const wasRunning = this.timer !== null;

    this.pause();
    this.#setGameSize();
    this.#render();
    this.#setNodes();

    if (wasRunning) this.start();
  }

  /**
   * Starts the simulation loop and transitions to `STARTED`. The seed pattern
   * is determined by the stored `#text`:
   * - When a text is set (via {@link showText}, including the logo painted by
   *   `#init`), it is repainted and used as the seed — it then dissolves into
   *   Conway's chaos as the game ticks. The text remains stored, so a later
   *   `start` repaints it again.
   * - Otherwise the board is re-randomized for a fresh game.
   *
   * Replaces an existing timer.
   */
  start() {
    if (this.timer) clearInterval(this.timer);

    if (this.#text !== null) {
      this.showText(this.#text);
    } else {
      this.randomize();
      this.#syncCells();
    }

    this.timer = setInterval(() => {
      this.#update();
    }, this.interval);

    this.#setGameState(GameOfLife.GameState.STARTED);
  }

  /** Pauses the simulation. Transitions to `PAUSED`. */
  pause() {
    clearInterval(this.timer);
    this.timer = null;

    this.#setGameState(GameOfLife.GameState.PAUSED);
  }

  /**
   * Resumes a paused simulation without re-randomizing. No-op when the current
   * state is not `PAUSED` (prevents accidental restarts from `STOPPED`/`GAMEOVER`).
   */
  continue() {
    if (this.gameState !== GameOfLife.GameState.PAUSED) return;

    this.timer = setInterval(() => {
      this.#update();
    }, this.interval);

    this.#setGameState(GameOfLife.GameState.STARTED);
  }

  /**
   * Halts the simulation but keeps the current pattern visible. Transitions to
   * `STOPPED`. Use {@link reset} to additionally clear the board.
   */
  stop() {
    this.#setGameState(GameOfLife.GameState.STOPPED);

    clearInterval(this.timer);
    this.timer = null;
  }

  /** Mirrors the in-memory `state` array onto the cached cell DOM nodes. */
  #syncCells() {
    for (let y = 0; y < this.state.length; y++) {
      for (let x = 0; x < this.state[y].length; x++) {
        this.#updateCell(x, y, this.state[y][x]);
      }
    }
  }

  /**
   * Recalculates grid dimensions from the host element's current size.
   * Cell count rounds down to fit; surplus pixels remain as empty space.
   */
  #setGameSize() {
    this.gameSize.x = Math.floor(this.gameWidth / this.cellSize);
    this.gameSize.y = Math.floor(this.gameHeight / this.cellSize);

    this.boardWidth = this.gameSize.x * this.cellSize;
    this.boardHeight = this.gameSize.y * this.cellSize;

    this.#clearState();
  }

  /** Resets the state matrix to an empty board and clears the cycle history. */
  #clearState() {
    this.state = Array.from({ length: this.gameSize.y }, () =>
      new Array(this.gameSize.x).fill(false),
    );
    this.history = [];
  }

  /**
   * Halts the simulation, clears the board and the stored text seed, and syncs
   * the DOM. Transitions to `STOPPED`. Use {@link stop} to halt without
   * clearing the pattern.
   */
  reset() {
    this.#setGameState(GameOfLife.GameState.STOPPED);

    clearInterval(this.timer);
    this.timer = null;
    this.#clearState();
    this.#text = null;
    this.#syncCells();
  }

  /**
   * Replaces the current state with a uniformly random alive/dead pattern
   * (~50 % live cells). Clears the cycle history and the stored text seed so
   * the next {@link start} randomizes again.
   */
  randomize() {
    this.state = this.state.map((row) => row.map(() => Math.random() > 0.5));
    this.history = [];
    this.#text = null;
  }

  /**
   * Sets the state so the cells spell out `text` using {@link FONT_3X5},
   * centered on the board. Input is lowercased before lookup; unsupported
   * characters are skipped silently. Falls back to {@link randomize} when the
   * rendered text does not fit the grid. Updates the DOM via `#syncCells` so
   * the result is visible immediately.
   *
   * Stores `text` as the preferred seed for the next {@link start} (cleared by
   * {@link randomize} or {@link reset}).
   * @param {string} [text="qp-game-of-life"]
   *
   * @example
   *   const game = document.querySelector("qp-game-of-life");
   *   game.showText("hello world");
   *   game.showText("Conway 2026");
   *   game.showText("123-456");
   */
  showText(text = "qp-game-of-life") {
    const normalized = text.toLowerCase();
    const charSpacing = 1;
    const totalWidth = normalized.length * (FONT_3X5_CHAR_WIDTH + charSpacing) - charSpacing;

    if (totalWidth > this.gameSize.x || FONT_3X5_CHAR_HEIGHT > this.gameSize.y) {
      this.randomize();
      this.#syncCells();
      return;
    }

    this.#clearState();

    const offsetX = Math.floor((this.gameSize.x - totalWidth) / 2);
    const offsetY = Math.floor((this.gameSize.y - FONT_3X5_CHAR_HEIGHT) / 2);

    for (let charIdx = 0; charIdx < normalized.length; charIdx++) {
      const bitmap = FONT_3X5[normalized[charIdx]];

      if (!bitmap) continue;

      const charX = offsetX + charIdx * (FONT_3X5_CHAR_WIDTH + charSpacing);

      for (let y = 0; y < FONT_3X5_CHAR_HEIGHT; y++) {
        for (let x = 0; x < FONT_3X5_CHAR_WIDTH; x++) {
          if (bitmap[y][x] === "#") {
            this.state[offsetY + y][charX + x] = true;
          }
        }
      }
    }

    this.#text = text;
    this.#syncCells();
  }

  /**
   * Builds the board markup and replaces the host's contents. Sizing CSS
   * variables (`--size-x`, `--size-y`, `--cell-size`, `--width`, `--height`)
   * are set on the shadow host (or directly on `this.game` in standalone use)
   * so siblings of the board (e.g. an overlay) can consume them.
   */
  #render() {
    const target = this.game.getRootNode().host || this.game;

    target.style.setProperty("--size-x", this.gameSize.x);
    target.style.setProperty("--size-y", this.gameSize.y);
    target.style.setProperty("--cell-size", `${this.cellSize}px`);
    target.style.setProperty("--width", `${this.boardWidth}px`);
    target.style.setProperty("--height", `${this.boardHeight}px`);

    const boardTmpl = `
      <div class="qp-board">
    ${this.state
      .map((row, y) => {
        return row
          .map((isAlive, x) => {
            return `<div class="qp-cell${isAlive ? " is-alive" : ""}" id="qp-cell-${x}-${y}" data-x="${x}" data-y="${y}"></div>`;
          })
          .join("");
      })
      .join("")}
      </div>
    `;

    this.game.innerHTML = boardTmpl;
  }

  /**
   * Advances the simulation by one tick:
   * 1. Computes the next state per Conway's rules.
   * 2. Applies a minimal diff to the DOM.
   * 3. Hashes the new state and compares against the history to detect cycles.
   * On cycle detection (still-life or oscillator), ends the game.
   */
  #update() {
    const next = this.state.map((row, y) =>
      row.map((isAlive, x) => {
        const neighbors = this.#getNeighbors(x, y);

        // Conway's rules: live cell survives with 2-3 neighbors; dead cell becomes alive with exactly 3 living neighbors.
        return isAlive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
      }),
    );

    // Apply diff to DOM.
    for (let y = 0; y < next.length; y++) {
      for (let x = 0; x < next[y].length; x++) {
        if (next[y][x] !== this.state[y][x]) {
          this.#updateCell(x, y, next[y][x]);
        }
      }
    }

    this.state = next;

    // Detect cycle (still-life = period 1, oscillators = period 2+).
    const hash = next.map((row) => row.map((cell) => (cell ? 1 : 0)).join("")).join("|");

    if (this.history.includes(hash)) {
      this.#dispatchGameOver();
      return;
    }

    this.history.push(hash);

    if (this.history.length > GameOfLife.MAX_HISTORY) this.history.shift();
  }

  /** Stops the timer and transitions to `GAMEOVER`. */
  #dispatchGameOver() {
    clearInterval(this.timer);
    this.timer = null;

    this.#setGameState(GameOfLife.GameState.GAMEOVER);
  }

  /**
   * Toggles the `is-alive` class on a single cell DOM node.
   * @param {number} x - Column index.
   * @param {number} y - Row index.
   * @param {boolean} isAlive
   */
  #updateCell(x, y, isAlive) {
    this.cells[y][x].classList.toggle("is-alive", isAlive);
  }

  /**
   * Counts living neighbors (Moore neighborhood, 8 cells) of the given position
   * in the current state. Out-of-bounds positions are skipped.
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  #getNeighbors(x, y) {
    const number = [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
    ].filter(([nx, ny]) => this.#isValidPosition(nx, ny) && this.state[ny][nx]).length;

    return number;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean} True if (x, y) lies inside the current grid.
   */
  #isValidPosition(x, y) {
    return x >= 0 && x < this.gameSize.x && y >= 0 && y < this.gameSize.y;
  }

  /** Caches DOM references for every cell after a render so `#updateCell` can hit nodes directly. */
  #setNodes() {
    this.board = this.game.querySelector(".qp-board");

    this.cells = Array.from({ length: this.gameSize.y }, (_, y) =>
      Array.from({ length: this.gameSize.x }, (_, x) =>
        this.board.querySelector(`#qp-cell-${x}-${y}`),
      ),
    );
  }
}

export default GameOfLife;
