import * as esbuild from "esbuild";
import { cpSync } from "node:fs";

const watchMode = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["qp-game-of-life.wc.js"],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: "esm",
  target: ["es2022"],
  outfile: "docs/qp-game-of-life.bundle.js",
};

if (watchMode) {
  const ctx = await esbuild.context({ ...buildOptions, logLevel: "info" });
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);
  // cpSync("images", "docs/images", { recursive: true });
  console.log("Build complete.");
}
