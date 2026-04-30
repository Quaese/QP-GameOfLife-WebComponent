import GameOfLife from "./qp-game-of-life.class.js";

const DEFAULT_CELL_SIZE = 20;
const DEFAULT_INTERVAL = 500;

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
    border: 1px solid #efefef;
    width: var(--cell-size);
    height: var(--cell-size);
  }

  .qp-cell.is-alive {
    background-color: #000;
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
`;

class GameOfLifeElement extends HTMLElement {
  constructor() {
    super();

    // Zugriff von außen auf das Game-Objekt
    this.attachShadow({ mode: "open" });
  }

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
        <button type="button" class="qp-overlay-button">Restart</button>
      </div>
    `;

    this.overlay = overlay;
    this.shadowRoot.append(style, host, overlay);

    overlay.querySelector(".qp-overlay-button").addEventListener("click", () => {
      this.hideOverlay();
      this.game?.start();
    });

    host.addEventListener("qp-game-of-life:gameover", () => {
      this.showOverlay();
    });

    if (!this.hasAttribute("cell-size")) this.setAttribute("cell-size", DEFAULT_CELL_SIZE);
    if (!this.hasAttribute("interval")) this.setAttribute("interval", DEFAULT_INTERVAL);

    this.game = new GameOfLife({
      game: host,
      cellSize: Number(this.getAttribute("cell-size")) || DEFAULT_CELL_SIZE,
      interval: Number(this.getAttribute("interval")) || DEFAULT_INTERVAL,
    });
  }

  disconnectedCallback() {
    this.game?.pause();
  }

  hideOverlay() {
    this.overlay.classList.remove("is-visible");
  }
  showOverlay() {
    this.overlay.classList.add("is-visible");
  }

  start() {
    this.hideOverlay();
    this.game?.start();
  }

  stop() {
    this.game?.stop();
  }

  pause() {
    this.game?.pause();
  }

  continue() {
    this.game?.continue();
  }

  reset() {
    this.game?.pause();
    this.game?.reset();
    this.game?.syncCells();
  }

  randomize() {
    this.game?.randomize();
  }
}

customElements.define("qp-game-of-life", GameOfLifeElement);

export default GameOfLifeElement;
