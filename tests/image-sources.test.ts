import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveExternalImageSources } from "../src/lib/imageApi";

const withEnv = (values: Record<string, string | undefined>, run: () => void) => {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key] as string | undefined]));
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

test("no Cloudflare origin is invented when the environment does not configure one", () => {
  withEnv({ CLOUDFLARE_R2_PUBLIC_URL: undefined, CLOUDFLARE_IMAGES_DELIVERY_URL: undefined }, () => {
    const providers = resolveExternalImageSources("best-sellers/tab-all.webp").map((source) => source.provider);
    assert.deepEqual(providers, ["cloudflare-jsdelivr-cdn", "github-raw-cdn", "github-api-raw"]);
  });
});

test("a configured R2 bucket is tried first, with the exact asset path", () => {
  withEnv(
    {
      CLOUDFLARE_R2_PUBLIC_URL: "https://acct.r2.cloudflarestorage.com/public/eltaranisi-images/",
      CLOUDFLARE_IMAGES_DELIVERY_URL: "https://imagedelivery.net/hash",
    },
    () => {
      const sources = resolveExternalImageSources("new-arrivals/getaway-still.webp");
      assert.deepEqual(sources.map((source) => source.provider), [
        "cloudflare-r2",
        "cloudflare-images",
        "cloudflare-jsdelivr-cdn",
        "github-raw-cdn",
        "github-api-raw",
      ]);
      assert.equal(sources[0].url, "https://acct.r2.cloudflarestorage.com/public/eltaranisi-images/new-arrivals/getaway-still.webp");
      assert.equal(sources[1].url, "https://imagedelivery.net/hash/new-arrivals/getaway-still.webp/public");
    },
  );
});

test("the sync list and the rewrite rules keep the same asset names", () => {
  const script = readFileSync("scripts/sync-cloudflare-images.mjs", "utf8");
  const listed = [...script.matchAll(/"((?:new-arrivals|best-sellers)\/[a-z-]+\.(?:webp|svg))"/g)].map((m) => m[1]);
  assert.ok(listed.length >= 12, "the rails and footer assets must stay in the sync list");
  for (const relPath of listed) {
    assert.match(relPath, /^[a-z0-9-]+\/[a-z0-9-]+\.(webp|svg)$/);
    const [provider] = resolveExternalImageSources(relPath);
    assert.ok(provider.url.endsWith(relPath), relPath);
  }
  // A typo in this list would silently publish nothing for a live asset.
  assert.ok(!script.includes("best-ellers"), "no mistyped asset path");
});
