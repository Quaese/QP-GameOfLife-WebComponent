/**
 * Word pool for the random-text feature.
 *
 * Curated around Game-of-Life terminology. Entries should be renderable by
 * {@link FONT_3X5} (lowercase letters, digits, `-`, ` `) and fit a typical
 * board — long words (~12+ chars) may trigger the `showText` fallback to
 * `randomize` on small grids.
 *
 * @readonly
 */
const WORDS = Object.freeze([
  "qp-game-of-life",
  "www.quaese.de",
  "conway",
  "blinker",
  "glider",
  "pulsar",
  "toad",
  "beacon",
  "spaceship",
  "still life",
  "evolution",
  "automaton",
  "cellular",
  "infinite",
  "pattern",
  "oscillator",
  "diehard",
  "methuselah",
]);

export default WORDS;
