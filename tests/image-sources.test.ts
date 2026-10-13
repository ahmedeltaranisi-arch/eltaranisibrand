import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cloudflareAssetRoot, DEFAULT_CLOUDFLARE_ASSETS_URL, resolveExternalImageSources } from "../src/lib/imageApi";

const ASSET_ENV = {
  CLOUDFLARE_ASSETS_PUBLIC_URL: undefined,
  CLOUDFLARE_R2_PUBLIC_URL: undefined,
  CLOUDFLARE_ASSETS_DISABLED: undefined,
  CLOUDFLARE_IMAGES_DELIVERY_URL: undefined,
};

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

const providersOf = (path: string) => resolveExternalImageSources(path).map((source) => source.provider);

test("the published Cloudflare asset origin is the first thing tried", () => {
  withEnv(ASSET_ENV, () => {
    assert.equal(cloudflareAssetRoot(), DEFAULT_CLOUDFLARE_ASSETS_URL);
    const sources = resolveExternalImageSources("best-sellers/tab-all.webp");
    assert.deepEqual(sources.map((s) => s.provider), [
      "cloudflare-assets",
      "cloudflare-jsdelivr-cdn",
      "github-raw-cdn",
      "github-api-raw",
    ]);
    assert.equal(sources[0].url, `${DEFAULT_CLOUDFLARE_ASSETS_URL}/img/best-sellers/tab-all.webp`);
  });
});

test("the mirrors alone carry the site when the asset origin is switched off", () => {
  withEnv({ ...ASSET_ENV, CLOUDFLARE_ASSETS_DISABLED: "1" }, () => {
    assert.equal(cloudflareAssetRoot(), null);
    assert.deepEqual(providersOf("best-sellers/tab-all.webp"), [
      "cloudflare-jsdelivr-cdn",
      "github-raw-cdn",
      "github-api-raw",
    ]);
  });
});

test("a broken override is left broken instead of being patched over by the default", () => {
  for (const value of ["pub-1234.r2.dev", "http://images.example.test", "not a url"]) {
    withEnv({ ...ASSET_ENV, CLOUDFLARE_ASSETS_PUBLIC_URL: value }, () => {
      assert.equal(cloudflareAssetRoot(), null, value);
      assert.equal(providersOf("hero-1.jpeg").includes("cloudflare-assets"), false, value);
    });
  }
  // An empty variable means "not configured", so the published origin still applies.
  withEnv({ ...ASSET_ENV, CLOUDFLARE_ASSETS_PUBLIC_URL: "   " }, () => {
    assert.equal(cloudflareAssetRoot(), DEFAULT_CLOUDFLARE_ASSETS_URL);
  });
});

test("an explicit https root wins, and the Images delivery URL follows it", () => {
  withEnv(
    {
      ...ASSET_ENV,
      CLOUDFLARE_ASSETS_PUBLIC_URL: "https://images.example.test/",
      CLOUDFLARE_IMAGES_DELIVERY_URL: "https://imagedelivery.net/hash",
    },
    () => {
      const sources = resolveExternalImageSources("new-arrivals/getaway-still.webp");
      assert.deepEqual(sources.map((s) => s.provider), [
        "cloudflare-assets",
        "cloudflare-images",
        "cloudflare-jsdelivr-cdn",
        "github-raw-cdn",
        "github-api-raw",
      ]);
      assert.equal(sources[0].url, "https://images.example.test/img/new-arrivals/getaway-still.webp");
      assert.equal(sources[1].url, "https://imagedelivery.net/hash/new-arrivals/getaway-still.webp/public");
    },
  );
});

test("an R2 root stays valid for a bucket that is already public", () => {
  withEnv({ ...ASSET_ENV, CLOUDFLARE_R2_PUBLIC_URL: "https://pub-1234.r2.dev" }, () => {
    assert.equal(cloudflareAssetRoot(), "https://pub-1234.r2.dev");
  });
});

test("the sync list and the rewrite rules keep the same asset names", () => {
  const script = readFileSync("scripts/sync-cloudflare-images.mjs", "utf8");
  const listed = [...script.matchAll(/"((?:new-arrivals|best-sellers)\/[a-z-]+\.(?:webp|svg))"/g)].map((m) => m[1]);
  assert.ok(listed.length >= 12, "the rails and footer assets must stay in the sync list");
  for (const relPath of listed) {
    assert.match(relPath, /^[a-z0-9-]+\/[a-z0-9-]+\.(webp|svg)$/);
    withEnv({ ...ASSET_ENV, CLOUDFLARE_ASSETS_PUBLIC_URL: "https://images.example.test" }, () => {
      const [provider] = resolveExternalImageSources(relPath);
      assert.equal(provider.provider, "cloudflare-assets");
      assert.equal(provider.url, `https://images.example.test/img/${relPath}`);
    });
  }
  // A typo in this list would silently publish nothing for a live asset.
  assert.ok(!script.includes("best-ellers"), "no mistyped asset path");
});
