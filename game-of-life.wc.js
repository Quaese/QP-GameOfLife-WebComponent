import GameOfLife from "./game-of-life.js";

const DEFAULT_CELL_SIZE = 20;
const DEFAULT_INTERVAL = 500;

const styles = `
  :host { display: block; }

  .qp-host { width: 100%; height: 100%; }

  .qp-board {
    --border-width: 1px;
    display: grid;
    grid-template-columns: repeat(var(--size-x), var(--cell-size));
    grid-template-rows: repeat(var(--size-y), var(--cell-size));
    border: var(--border-width) solid #000;
    width: calc(var(--width) + 2 * var(--border-width));
    height: calc(var(--height) + 2 * var(--border-width));
    box-sizing: content-box;
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

    this.shadowRoot.append(style, host);

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

  start() {
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
    this.game?.reset();
  }

  randomize() {
    this.game?.randomize();
  }
}

customElements.define("qp-game-of-life", GameOfLifeElement);

export default GameOfLifeElement;
