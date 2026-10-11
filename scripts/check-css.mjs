import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Build guard: asserts the emitted CSS actually contains generated Tailwind
 * utilities — not just the hand-written component classes in globals.css.
 *
 * This exists because a missing postcss.config.mjs produces a build that
 * compiles cleanly, ships ~6.5KB of CSS, and renders completely unstyled.
 * Checking only for `.eyebrow` / `.btn-solid` does NOT catch that, because
 * those are plain CSS we wrote ourselves.
 */

const dir = ".next/static/chunks";

function collectCss(d) {
  const out = [];
  for (const entry of readdirSync(d)) {
    const p = join(d, entry);
    if (statSync(p).isDirectory()) out.push(...collectCss(p));
    else if (entry.endsWith(".css")) out.push(p);
  }
  return out;
}

const files = collectCss(dir);
if (files.length === 0) {
  console.error("FAIL: no CSS found under .next/static/chunks — run `next build` first.");
  process.exit(1);
}

const css = files.map((f) => readFileSync(f, "utf8")).join("\n");
const kb = (css.length / 1024).toFixed(1);

// utilities that only exist if Tailwind actually ran over the source tree
const REQUIRED = [
  [".grid-cols-2", "layout utility"],
  [".max-w-7xl", "size utility"],
  [".sticky", "position utility"],
  [".hidden", "display utility"],
  [".bg-bone", "custom @theme colour utility"],
  [".text-ink", "custom @theme colour utility"],
  [".lg\\:grid-cols-4", "responsive variant"],
  [".animate-marquee", "@theme animation utility"],
  [".aspect-3\\/4", "aspect-ratio utility"],
  // hand-written component classes
  [".eyebrow", "component class"],
  [".btn-solid", "component class"],
  [".reveal", "component class"],
];

const missing = REQUIRED.filter(([sel]) => !css.includes(sel));

console.log(`CSS: ${files.length} file(s), ${kb} KB total`);

if (missing.length > 0) {
  console.error("\nFAIL — Tailwind output is incomplete or missing:");
  for (const [sel, why] of missing) console.error(`  - ${sel}  (${why})`);
  console.error(
    "\nLikely cause: postcss.config.mjs is missing or does not list\n" +
      '"@tailwindcss/postcss". The build will still succeed but the site\n' +
      "renders unstyled.",
  );
  process.exit(1);
}

if (Number(kb) < 20) {
  console.error(`\nFAIL — CSS is only ${kb} KB; expected a full Tailwind build (>20 KB).`);
  process.exit(1);
}

console.log(`OK: all ${REQUIRED.length} required selectors present, CSS ${kb} KB.`);
