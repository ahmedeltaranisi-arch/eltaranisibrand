#!/usr/bin/env node
/**
 * Syncs storefront images from the external asset snapshot to Cloudflare Images.
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/sync-cloudflare-images.mjs
 */

import { existsSync, readFileSync } from "node:fs";

const COMMIT = "a3f459561f4ebe6ffc5047a3e434a002b2d717aa";
const REPO = "ahmedeltaranisi-arch/eltaranisibrand";
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO}@${COMMIT}/public/img`;
const CF_API = "https://api.cloudflare.com/client/v4";

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error("Missing CLOUDFLARE_API_TOKEN environment variable.");
  process.exit(1);
}

async function resolveAccountId() {
  if (process.env.CLOUDFLARE_ACCOUNT_ID?.trim()) {
    return process.env.CLOUDFLARE_ACCOUNT_ID.trim();
  }
  const res = await fetch(`${CF_API}/accounts?page=1&per_page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const id = data?.result?.[0]?.id;
  if (!id) {
    throw new Error(`Could not resolve Cloudflare Account ID: ${JSON.stringify(data?.errors ?? data)}`);
  }
  return id;
}

const CORE_IMAGES = [
  "eltaranisi-logo.png",
  "hero-1.jpeg",
  "hero-2.jpeg",
  "hero-3.jpeg",
  "rev-a.jpg",
  "rev-b.jpg",
  "rev-c.jpg",
  "new-arrivals/getaway-street.webp",
  "new-arrivals/getaway-still.webp",
  "new-arrivals/mate-wordmark.svg",
  "new-arrivals/footer-monogram.svg",
  "new-arrivals/footer-mate-wordmark.svg",
  "best-sellers/tab-all.webp",
  "best-sellers/tab-activewear.webp",
  "best-sellers/tab-tees.webp",
  "best-sellers/tab-sweats.webp",
  "best-sellers/tab-intimates.webp",
  "best-sellers/tab-sleep.webp",
  "best-sellers/editorial-primary.webp",
  "best-sellers/editorial-secondary.webp",
];

async function main() {
  const accountId = await resolveAccountId();
  console.log(`Syncing images to Cloudflare account ${accountId}...`);

  for (const relPath of CORE_IMAGES) {
    const form = new FormData();
    form.set("id", relPath);
    // Assets added in this checkout are not in the pinned snapshot, so upload the real
    // bytes from the workspace whenever they exist and fall back to the CDN otherwise.
    const local = `public/img/${relPath}`;
    if (existsSync(local)) {
      const bytes = readFileSync(local);
      form.set("file", new Blob([bytes], { type: relPath.endsWith(".svg") ? "image/svg+xml" : `image/${relPath.split(".").pop()}` }), relPath);
    } else {
      form.set("url", `${CDN_BASE}/${relPath}`);
    }
    form.set("requireSignedURLs", "false");

    const res = await fetch(`${CF_API}/accounts/${accountId}/images/v1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await res.json();
    console.log(`${relPath}: status=${res.status} success=${Boolean(body?.success)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
