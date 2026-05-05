var z=Object.freeze({a:[".#.","#.#","###","#.#","#.#"],b:["##.","#.#","##.","#.#","##."],c:[".##","#..","#..","#..",".##"],d:["##.","#.#","#.#","#.#","##."],e:["###","#..","##.","#..","###"],f:["###","#..","##.","#..","#.."],g:["###","#.#","###","..#","##."],h:["#.#","#.#","###","#.#","#.#"],i:[".#.","...",".#.",".#.",".#."],j:["..#","..#","..#","..#","##."],k:["#.#","#.#","##.","#.#","#.#"],l:["#..","#..","#..","#..","##."],m:["#.#","###","#.#","#.#","#.#"],n:["###","#.#","#.#","#.#","#.#"],o:["###","#.#","#.#","#.#","###"],p:["##.","#.#","##.","#..","#.."],q:[".##","#.#",".##","..#","..#"],r:["###","#.#","##.","#.#","#.#"],s:["###","#..","###","..#","###"],t:["###",".#.",".#.",".#.",".#."],u:["#.#","#.#","#.#","#.#","###"],v:["#.#","#.#","#.#","#.#",".#."],w:["#.#","#.#","#.#","###","#.#"],x:["#.#","#.#",".#.","#.#","#.#"],y:["#.#","#.#",".#.",".#.",".#."],z:["###","..#",".#.","#..","###"],0:["###","#.#","#.#","#.#","###"],1:[".#.","##.",".#.",".#.","###"],2:["###","..#","###","#..","###"],3:["###","..#","###","..#","###"],4:["#.#","#.#","###","..#","..#"],5:["###","#..","###","..#","###"],6:["###","#..","###","#.#","###"],7:["###","..#","..#","..#","..#"],8:["###","#.#","###","#.#","###"],9:["###","#.#","###","..#","###"],"-":["...","...","###","...","..."],".":["...","...","...","...",".#."]," ":["...","...","...","...","..."]}),c=3,d=5,f=z;var g=class a{static DELAY=200;static MAX_HISTORY=20;static GameState=Object.freeze({INIT:"init",STARTED:"started",PAUSED:"paused",STOPPED:"stopped",GAMEOVER:"gameover"});#s;#e=null;constructor(t){t.game&&(this.game=t.game,this.gameWidth=this.game.offsetWidth,this.gameHeight=this.game.offsetHeight,this.cellSize=t.cellSize||20,this.state=[],this.gameSize={x:0,y:0},this.history=[],this.interval=t.interval||500,this.timer=null,this.gameState=a.GameState.INIT,this.#s=this.#d(()=>this.#m(),a.DELAY),this.#c())}#t(t){if(this.gameState===t)return;let e=this.gameState;this.gameState=t,this.game.dispatchEvent(new CustomEvent("qp-game-of-life:statechange",{bubbles:!0,composed:!0,detail:{previousState:e,currentState:t}}))}#c(){window.addEventListener("resize",this.#s),this.#r(),this.#o(),this.#n(),this.showText()}destroy(){this.pause(),window.removeEventListener("resize",this.#s)}#d(t,e){let i;return()=>{i&&clearTimeout(i),i=setTimeout(t,e)}}#m(){this.gameWidth=this.game.offsetWidth,this.gameHeight=this.game.offsetHeight;let t=this.timer!==null;this.pause(),this.#r(),this.#o(),this.#n(),t&&this.start()}start(){this.timer&&clearInterval(this.timer),this.#e!==null?this.showText(this.#e):(this.randomize(),this.#i()),this.timer=setInterval(()=>{this.#h()},this.interval),this.#t(a.GameState.STARTED)}pause(){clearInterval(this.timer),this.timer=null,this.#t(a.GameState.PAUSED)}continue(){this.gameState===a.GameState.PAUSED&&(this.timer=setInterval(()=>{this.#h()},this.interval),this.#t(a.GameState.STARTED))}stop(){this.#t(a.GameState.STOPPED),clearInterval(this.timer),this.timer=null}#i(){for(let t=0;t<this.state.length;t++)for(let e=0;e<this.state[t].length;e++)this.#l(e,t,this.state[t][e])}#r(){this.gameSize.x=Math.floor(this.gameWidth/this.cellSize),this.gameSize.y=Math.floor(this.gameHeight/this.cellSize),this.boardWidth=this.gameSize.x*this.cellSize,this.boardHeight=this.gameSize.y*this.cellSize,this.#a()}#a(){this.state=Array.from({length:this.gameSize.y},()=>new Array(this.gameSize.x).fill(!1)),this.history=[]}reset(){this.#t(a.GameState.STOPPED),clearInterval(this.timer),this.timer=null,this.#a(),this.#e=null,this.#i()}randomize(){this.state=this.state.map(t=>t.map(()=>Math.random()>.5)),this.history=[],this.#e=null}showText(t="qp-game-of-life"){let e=t.toLowerCase(),i=1,s=e.length*(c+i)-i;if(s>this.gameSize.x||d>this.gameSize.y){this.randomize(),this.#i();return}this.#a();let r=Math.floor((this.gameSize.x-s)/2),h=Math.floor((this.gameSize.y-d)/2);for(let o=0;o<e.length;o++){let u=f[e[o]];if(!u)continue;let S=r+o*(c+i);for(let l=0;l<d;l++)for(let n=0;n<c;n++)u[l][n]==="#"&&(this.state[h+l][S+n]=!0)}this.#e=t,this.#i()}#o(){let t=this.game.getRootNode().host||this.game;t.style.setProperty("--size-x",this.gameSize.x),t.style.setProperty("--size-y",this.gameSize.y),t.style.setProperty("--cell-size",`${this.cellSize}px`),t.style.setProperty("--width",`${this.boardWidth}px`),t.style.setProperty("--height",`${this.boardHeight}px`);let e=`
      <div class="qp-board">
    ${this.state.map((i,s)=>i.map((r,h)=>`<div class="qp-cell${r?" is-alive":""}" id="qp-cell-${h}-${s}" data-x="${h}" data-y="${s}"></div>`).join("")).join("")}
      </div>
    `;this.game.innerHTML=e}#h(){let t=this.state.map((i,s)=>i.map((r,h)=>{let o=this.#p(h,s);return r&&o===2||o===3}));for(let i=0;i<t.length;i++)for(let s=0;s<t[i].length;s++)t[i][s]!==this.state[i][s]&&this.#l(s,i,t[i][s]);this.state=t;let e=t.map(i=>i.map(s=>s?1:0).join("")).join("|");if(this.history.includes(e)){this.#g();return}this.history.push(e),this.history.length>a.MAX_HISTORY&&this.history.shift()}#g(){clearInterval(this.timer),this.timer=null,this.#t(a.GameState.GAMEOVER)}#l(t,e,i){this.cells[e][t].classList.toggle("is-alive",i)}#p(t,e){return[[t-1,e-1],[t,e-1],[t+1,e-1],[t-1,e],[t+1,e],[t-1,e+1],[t,e+1],[t+1,e+1]].filter(([s,r])=>this.#u(s,r)&&this.state[r][s]).length}#u(t,e){return t>=0&&t<this.gameSize.x&&e>=0&&e<this.gameSize.y}#n(){this.board=this.game.querySelector(".qp-board"),this.cells=Array.from({length:this.gameSize.y},(t,e)=>Array.from({length:this.gameSize.x},(i,s)=>this.board.querySelector(`#qp-cell-${s}-${e}`)))}},v=g;var x=Object.freeze(["qp-game-of-life","www.quaese.de","conway","blinker","glider","pulsar","toad","beacon","spaceship","still life","evolution","automaton","cellular","infinite","pattern","oscillator","diehard","methuselah"]),p=x;var b=20,y=500,w=`
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
`,m=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){if(this.game)return;let t=document.createElement("style");t.textContent=w;let e=document.createElement("div");e.className="qp-host";let i=document.createElement("div");i.className="qp-overlay",i.innerHTML=`
      <div class="qp-overlay-content">
        <p class="qp-overlay-title">Game Over</p>
        <div class="qp-overlay-actions">
          <button type="button" class="qp-overlay-button" data-action="restart">Restart</button>
          <button type="button" class="qp-overlay-button qp-overlay-button--secondary" data-action="close">Close</button>
        </div>
      </div>
    `,this.overlay=i,this.shadowRoot.append(t,e,i),i.querySelector('[data-action="restart"]').addEventListener("click",()=>{this.hideOverlay(),this.game?.start()}),i.querySelector('[data-action="close"]').addEventListener("click",()=>{this.hideOverlay()}),e.addEventListener("qp-game-of-life:statechange",s=>{s.detail.currentState==="gameover"&&this.showOverlay()}),this.hasAttribute("cell-size")||this.setAttribute("cell-size",b),this.hasAttribute("interval")||this.setAttribute("interval",y),this.game=new v({game:e,cellSize:Number(this.getAttribute("cell-size"))||b,interval:Number(this.getAttribute("interval"))||y})}disconnectedCallback(){this.game?.destroy()}hideOverlay(){this.overlay.classList.remove("is-visible")}showOverlay(){this.overlay.classList.add("is-visible")}start(){this.hideOverlay(),this.game?.start()}stop(){this.game?.stop()}pause(){this.game?.pause()}continue(){this.game?.continue()}reset(){this.game?.reset()}randomize(){this.game?.randomize()}showText(t){this.game?.showText(t)}randomText(){let t=p[Math.floor(Math.random()*p.length)];this.showText(t)}get gameState(){return this.game?.gameState}};customElements.define("qp-game-of-life",m);var I=m;export{I as default};
//# sourceMappingURL=qp-game-of-life.bundle.js.map
