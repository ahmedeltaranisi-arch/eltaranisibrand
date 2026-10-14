#!/usr/bin/env node
/**
 * Keeps the catalogue's own vocabulary in the message files.
 *
 *   node scripts/sync-catalogue-labels.mjs
 *
 * A card, a drawer row and a product page all read their words out of next-intl by key
 * (`products.<style>`, `color.<dye>`, `colorGroup.<group>`), and the catalogue grows whenever a
 * colourway is ingested from the reference. This script adds the missing label for every style,
 * dye and colour group the catalogue really carries — the reference's own title for a style, its
 * own dye name for a colour — and fails loudly if a key is still unanswered.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(join(ROOT, "src/lib/shopAllCatalog.json"), "utf8"));

/** Title Case from the reference's own upper-case dye names ("JET BLACK" → "Jet Black"). */
const titleCase = (value) =>
  String(value).trim().split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

const styles = new Map();
const colors = new Map();
const groups = new Set();
for (const product of catalog.products) {
  if (!styles.has(product.style)) styles.set(product.style, product.title);
  if (!colors.has(product.color.name)) colors.set(product.color.name, product.color.label || titleCase(product.color.name));
  const group = product.group || product.color.group;
  if (group) groups.add(group);
}

const added = { styles: 0, colors: 0, groups: 0 };
for (const [locale, isArabic] of [["en", false], ["ar", true]]) {
  const path = join(ROOT, `messages/${locale}.json`);
  const messages = JSON.parse(readFileSync(path, "utf8"));
  const arrivals = messages.newArrivals;
  arrivals.products ??= {};
  arrivals.color ??= {};
  arrivals.colorGroup ??= {};
  for (const [style, title] of styles) {
    if (!arrivals.products[style]) {
      arrivals.products[style] = title;
      if (!isArabic) added.styles += 1;
    }
  }
  for (const [name, label] of colors) {
    if (!arrivals.color[name]) {
      arrivals.color[name] = label;
      if (!isArabic) added.colors += 1;
    }
  }
  for (const group of groups) {
    if (!arrivals.colorGroup[group]) {
      arrivals.colorGroup[group] = titleCase(group);
      if (!isArabic) added.groups += 1;
    }
  }
  writeFileSync(path, JSON.stringify(messages, null, 2) + "\n");
}

// A key the message files still cannot answer would print as its own path on the storefront.
const missing = [];
for (const locale of ["en", "ar"]) {
  const arrivals = JSON.parse(readFileSync(join(ROOT, `messages/${locale}.json`), "utf8")).newArrivals;
  for (const style of styles.keys()) if (!arrivals.products[style]) missing.push(`${locale}: products.${style}`);
  for (const name of colors.keys()) if (!arrivals.color[name]) missing.push(`${locale}: color.${name}`);
  for (const group of groups) if (!arrivals.colorGroup[group]) missing.push(`${locale}: colorGroup.${group}`);
}
console.log(`labels added — styles ${added.styles}, dyes ${added.colors}, colour groups ${added.groups}`);
console.log(`catalogue vocabulary: ${styles.size} styles, ${colors.size} dyes, ${groups.size} colour groups`);
if (missing.length) {
  console.log("still unnamed:", missing.join(", "));
  process.exitCode = 1;
}
