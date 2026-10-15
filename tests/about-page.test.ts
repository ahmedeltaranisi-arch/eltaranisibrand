import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/app/[locale]/pages/about/page.tsx", "utf8");
const en = JSON.parse(readFileSync("messages/en.json", "utf8")) as {
  about: {
    hero: { title: string; eyebrow: string };
    story: { paragraphs: string[] };
    tiles: { fabricLibrary: string; journal: string };
  };
};
const about = en.about;

const suppliedImages = [
  "/img/about/hero-left.jpg",
  "/img/about/hero-right.jpg",
  "/img/about/story-portrait.jpg",
  "/img/about/materials-portrait.jpg",
  "/img/about/fullbleed-story.jpg",
  "/img/about/people-and-practice.jpg",
  "/img/about/responsibility.jpg",
  "/img/about/fabric-library.jpg",
  "/img/about/everyday-essentials.jpg",
];

test("About is built from the supplied editorial assets and shows the Eltaranisi identity", () => {
  assert.equal(about.hero.title, "Style with standards.");
  assert.match(about.hero.eyebrow, /Eltaranisi Brand/);
  assert.match(about.story.paragraphs[1], /More than a decade later/);
  assert.doesNotMatch(JSON.stringify(about), /\bMATE\b/i);
  for (const image of suppliedImages) {
    assert.ok(page.includes(image), `${image} is not used by the About layout`);
    assert.ok(existsSync(`public${image}`), `${image} is missing from the supplied assets`);
  }
  assert.doesNotMatch(page, /\/img\/about\/standards\.jpg/, "the unused tank photo exposes a reference-brand neck label");
});

test("About exposes real in-page destinations for Fabric Library and Journal", () => {
  assert.match(page, /id="materials"/);
  assert.match(page, /href="\/pages\/about#materials"/);
  assert.match(page, /id="journal"/);
  assert.match(page, /href="\/pages\/about#journal"/);
  assert.equal(about.tiles.fabricLibrary, "Fabric Library");
  assert.equal(about.tiles.journal, "Journal");
});
