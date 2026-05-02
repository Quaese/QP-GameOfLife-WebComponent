import GameOfLife from "./qp-game-of-life.class.js";
import WORDS from "./words.js";

/** Default cell side length in pixels when the `cell-size` attribute is absent. */
const DEFAULT_CELL_SIZE = 20;

/** Default tick interval in milliseconds when the `interval` attribute is absent. */
const DEFAULT_INTERVAL = 500;

/** Shadow DOM stylesheet for the board, cells, and game-over overlay. */
const styles = `
  :host {
    --border-width: 1px;
    display: block;
    position: relative;
  }

  .qp-host { width: 100%; height: 100%; }

  .qp-board {
    display: grid;
    grid-template-columns: repeat(var(--size-x), var(--cell-size));
    grid-template-rows: repeat(var(--size-y), var(--cell-size));
    border: var(--border-width) solid #000;
    width: calc(var(--width) + 2 * var(--border-width));
    height: calc(var(--height) + 2 * var(--border-width));
    box-sizing: content-box;
    margin: 0 auto;
  }

  .qp-cell {
    background-color: #ccc;
    // background-color: var(--ivory-patina);
    border: 1px solid #efefef;
    width: var(--cell-size);
    height: var(--cell-size);
  }

  .qp-cell.is-alive {
    background-color: #666;
    // background-color: var(--vintage-stitch-full);
  }

  .qp-overlay {
    position: absolute;
    top: var(--border-width);
    left: 50%;
    transform: translateX(-50%);
    width: calc(var(--width) + 2 * var(--border-width));
    height: calc(var(--height) + 2 * var(--border-width));
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(2px);
    z-index: 10;
  }

  .qp-overlay.is-visible {
    display: flex;
  }

  .qp-overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: #fff;
    border: 1px solid #000;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .qp-overlay-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .qp-overlay-actions {
    display: flex;
    gap: 0.75rem;
  }

  .qp-overlay-button {
    padding: 0.5rem 1.25rem;
    border: 1px solid #000;
    border-radius: 4px;
    background: #000;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .qp-overlay-button:hover {
    background: #333;
  }

  .qp-overlay-button--secondary {
    background: #fff;
    color: #000;
  }

  .qp-overlay-button--secondary:hover {
    background: #efefef;
  }
`;

/**
 * `<qp-game-of-life>` Custom Element. Wraps {@link GameOfLife} in a shadow DOM
 * and renders a game-over overlay with Restart/Close actions.
 *
 * The element forwards lifecycle commands (`start`, `pause`, `continue`,
 * `stop`, `reset`, `randomize`) to the underlying simulation and exposes the
 * current `gameState` as a read-only property.
 *
 * @element qp-game-of-life
 *
 * @attr {number} [cell-size=20] - Cell side length in pixels.
 * @attr {number} [interval=500] - Tick interval in milliseconds.
 *
 * @fires qp-game-of-life:statechange - Bubbles out of the shadow DOM on every
 *   lifecycle transition. `event.detail` is `{ previousState, currentState }`.
 *   See {@link GameOfLife.GameState} for possible values.
 *
 * @example
 *   <qp-game-of-life style="width: 100%; height: 30vh;" cell-size="15" interval="100"></qp-game-of-life>
 */
class GameOfLifeElement extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });
  }

  /**
   * Builds the shadow DOM (style, board host, overlay), wires up overlay
   * actions and the gameover listener, and instantiates the simulation.
   * Idempotent — re-attaching the element does not recreate the game.
   */
  connectedCallback() {
    if (this.game) return;

    const style = document.createElement("style");
    style.textContent = styles;

    const host = document.createElement("div");
    host.className = "qp-host";

    const overlay = document.createElement("div");
    overlay.className = "qp-overlay";
    overlay.innerHTML = `
      <div class="qp-overlay-content">
        <p class="qp-overlay-title">Game Over</p>
        <div class="qp-overlay-actions">
          <button type="button" class="qp-overlay-button" data-action="restart">Restart</button>
          <button type="button" class="qp-overlay-button qp-overlay-button--secondary" data-action="close">Close</button>
        </div>
      </div>
    `;

    this.overlay = overlay;
    this.shadowRoot.append(style, host, overlay);

    overlay.querySelector('[data-action="restart"]').addEventListener("click", () => {
      this.hideOverlay();
      this.game?.start();
    });

    overlay.querySelector('[data-action="close"]').addEventListener("click", () => {
      this.hideOverlay();
    });

    host.addEventListener("qp-game-of-life:statechange", (event) => {
      if (event.detail.currentState === "gameover") {
        this.showOverlay();
      }
    });

    if (!this.hasAttribute("cell-size")) this.setAttribute("cell-size", DEFAULT_CELL_SIZE);
    if (!this.hasAttribute("interval")) this.setAttribute("interval", DEFAULT_INTERVAL);

    this.game = new GameOfLife({
      game: host,
      cellSize: Number(this.getAttribute("cell-size")) || DEFAULT_CELL_SIZE,
      interval: Number(this.getAttribute("interval")) || DEFAULT_INTERVAL,
    });
  }

  /** Tears down the simulation (timer + global resize listener). */
  disconnectedCallback() {
    this.game?.destroy();
  }

  /** Hides the game-over overlay. */
  hideOverlay() {
    this.overlay.classList.remove("is-visible");
  }

  /** Shows the game-over overlay. */
  showOverlay() {
    this.overlay.classList.add("is-visible");
  }

  /** Hides the overlay (in case it was visible) and starts a fresh game. */
  start() {
    this.hideOverlay();
    this.game?.start();
  }

  /** Halts the simulation; the current pattern stays on screen. */
  stop() {
    this.game?.stop();
  }

  /** Pauses the simulation. */
  pause() {
    this.game?.pause();
  }

  /** Resumes a paused simulation. No-op outside of `PAUSED`. */
  continue() {
    this.game?.continue();
  }

  /** Halts the simulation and clears the board. */
  reset() {
    this.game?.reset();
  }

  /** Replaces the current state with a uniformly random pattern. */
  randomize() {
    this.game?.randomize();
  }

  /**
   * Paints `text` onto the board using a 3×5 bitmap font, centered.
   * Falls back to {@link randomize} when the text does not fit.
   * @param {string} [text="qp-game-of-life"]
   *
   * @example
   *   const game = document.querySelector("qp-game-of-life");
   *   game.showText("hello world");
   *   game.showText("Conway 2026");
   *   game.showText("123-456");
   */
  showText(text) {
    this.game?.showText(text);
  }

  /**
   * Picks a random word from the imported {@link WORDS} pool and paints it
   * onto the board via {@link showText}.
   */
  randomText() {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    this.showText(word);
  }

  /**
   * Current lifecycle state. One of {@link GameOfLife.GameState}.
   * @returns {string | undefined}
   */
  get gameState() {
    return this.game?.gameState;
  }
}

customElements.define("qp-game-of-life", GameOfLifeElement);

export default GameOfLifeElement;
