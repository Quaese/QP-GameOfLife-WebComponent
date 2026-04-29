class GameOfLife {
  static DELAY = 200;
  static MAX_HISTORY = 20;

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

    this.hResize = this.debounce(() => this.handleResize(), GameOfLife.DELAY);

    this.init();
  }

  init() {
    window.addEventListener("resize", this.hResize);

    this.setGameSize();
    this.randomize();
    this.render();
    this.setNodes();

    this.start();
  }

  debounce(fn, delay) {
    let timer;

    return () => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(fn, delay);
    };
  }

  handleResize() {
    this.gameWidth = this.game.offsetWidth;
    this.gameHeight = this.game.offsetHeight;

    const wasRunning = this.timer !== null;

    this.pause();
    this.setGameSize();
    this.render();
    this.setNodes();

    if (wasRunning) this.start();
  }

  start() {
    if (this.timer) clearInterval(this.timer);

    this.randomize();
    this.syncCells();

    this.timer = setInterval(() => {
      this.update();
    }, this.interval);
  }

  pause() {
    clearInterval(this.timer);
    this.timer = null;
  }

  continue() {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.update();
    }, this.interval);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.reset();
    this.syncCells();
  }

  syncCells() {
    for (let y = 0; y < this.state.length; y++) {
      for (let x = 0; x < this.state[y].length; x++) {
        this.updateCell(x, y, this.state[y][x]);
      }
    }
  }

  setGameSize() {
    this.gameSize.x = Math.floor(this.gameWidth / this.cellSize);
    this.gameSize.y = Math.floor(this.gameHeight / this.cellSize);

    this.boardWidth = this.gameSize.x * this.cellSize;
    this.boardHeight = this.gameSize.y * this.cellSize;

    this.reset();
  }

  reset() {
    this.state = Array.from({ length: this.gameSize.y }, () =>
      new Array(this.gameSize.x).fill(false),
    );
    this.history = [];
  }

  randomize() {
    this.state = this.state.map((row) => row.map(() => Math.random() > 0.5));
    this.history = [];
  }

  render() {
    // Lift sizing vars to the shadow host (or game element when standalone) so siblings can consume them.
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

  update() {
    const next = this.state.map((row, y) =>
      row.map((isAlive, x) => {
        const neighbors = this.getNeighbors(x, y);

        // Conway's rules: live cell survives with 2-3 neighbors; dead cell becomes alive with exactly 3 living neighbors.
        return isAlive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
      }),
    );

    // Apply diff to DOM.
    for (let y = 0; y < next.length; y++) {
      for (let x = 0; x < next[y].length; x++) {
        if (next[y][x] !== this.state[y][x]) {
          this.updateCell(x, y, next[y][x]);
        }
      }
    }

    this.state = next;

    // Detect cycle (still-life = period 1, oscillators = period 2+).
    const hash = next.map((row) => row.map((cell) => (cell ? 1 : 0)).join("")).join("|");

    if (this.history.includes(hash)) {
      this.dispatchGameOver();
      return;
    }

    this.history.push(hash);

    if (this.history.length > GameOfLife.MAX_HISTORY) this.history.shift();
  }

  dispatchGameOver() {
    clearInterval(this.timer);
    this.timer = null;

    this.game.dispatchEvent(new CustomEvent("qp-game-of-life:gameover", {
      bubbles: true,
      composed: true,
    }));
  }

  updateCell(x, y, isAlive) {
    this.cells[y][x].classList.toggle("is-alive", isAlive);
  }

  getNeighbors(x, y) {
    const number = [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1],
    ].filter(([p, q]) => this.isValidPosition(p, q) && this.state[q][p]).length;

    return number;
  }

  isValidPosition(p, q) {
    return p >= 0 && p < this.gameSize.x && q >= 0 && q < this.gameSize.y;
  }

  setNodes() {
    this.board = this.game.querySelector(".qp-board");

    this.cells = this.state.map((row, y) =>
      row.map((isAlive, x) => this.board.querySelector(`#qp-cell-${x}-${y}`)),
    );
  }
}

export default GameOfLife;
