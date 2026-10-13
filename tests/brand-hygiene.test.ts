import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * The storefront is Eltaranisi Brand. The reference store's name must never surface in copy a
 * customer can read, in a link they can click, or in an address they can mail — a leaked
 * `care@matethelabel.com` is a support inbox on somebody else's domain.
 */
// Deliberately case-sensitive on the word MATE: asset names such as `mate-wordmark.svg` are
// lowercase file paths, and a path is not a customer reading the wrong brand name.
const REFERENCE = /matethelabel\.com|mate_the_label|MATEtheLabel|\bMATE\b/;

const walkStrings = (value: unknown, at: string, into: Array<{ path: string; text: string }>) => {
  if (typeof value === "string") {
    into.push({ path: at, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, `${at}[${index}]`, into));
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) walkStrings(child, at ? `${at}.${key}` : key, into);
  }
};

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8")) as unknown;

const filesUnder = (dir: string, filter: (name: string) => boolean): string[] =>
  readdirSync(dir)
    .map((name) => join(dir, name))
    .flatMap((entry) => {
      if (statSync(entry).isDirectory()) return filesUnder(entry, filter);
      return filter(entry) ? [entry] : [];
    });

test("customer-visible locale copy never names the reference brand", () => {
  for (const locale of ["en", "ar"]) {
    const strings: Array<{ path: string; text: string }> = [];
    walkStrings(readJson(`messages/${locale}.json`), "", strings);
    for (const { path, text } of strings) {
      assert.equal(REFERENCE.test(text), false, `messages/${locale}.json → ${path}`);
    }
    assert.ok(
      strings.some(({ text }) => text.includes("care@eltaranisibrand.com")),
      `${locale} copy must offer our own support address`,
    );
  }
});

test("product copy describes Eltaranisi Brand, not the label it was cloned from", () => {
  const strings: Array<{ path: string; text: string }> = [];
  walkStrings(readJson("src/lib/newArrivalsCatalog.json"), "", strings);
  assert.ok(strings.length > 100, "the catalog is the product of the check");
  for (const { path, text } of strings) {
    assert.equal(REFERENCE.test(text), false, `newArrivalsCatalog.json → ${path}`);
  }
});

test("no source file links to the reference store", () => {
  const sources = filesUnder("src", (name) => /\.(tsx?|mjs|json)$/.test(name) && !name.endsWith(".d.ts"));
  assert.ok(sources.length > 40, "the component tree is the product of the check");
  for (const file of sources) {
    const hits = readFileSync(file, "utf8").match(/matethelabel\.com|mate_the_label/gi) ?? [];
    assert.deepEqual(hits, [], `${file} links to the reference brand`);
  }
  // The arrival/best-seller pages use the shared homepage footer, so the MATE-styled one stays gone.
  assert.equal(
    readdirSync("src/components/new-arrivals").some((name) => name.startsWith("ArrivalFooter")),
    false,
  );
});
