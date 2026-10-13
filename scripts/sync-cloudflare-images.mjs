#!/usr/bin/env node
/**
 * Publishes the storefront images to Cloudflare, so the app can serve them from a Cloudflare
 * origin instead of shipping them inside the deploy bundle.
 *
 *   # Cloudflare Images (needs an active Images subscription on the account)
 *   CLOUDFLARE_API_TOKEN=... [CLOUDFLARE_ACCOUNT_ID=...] node scripts/sync-cloudflare-images.mjs
 *
 *   # Cloudflare R2 (no subscription needed; the bucket's public URL is what the app reads)
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_R2_BUCKET=my-bucket \
 *   CLOUDFLARE_R2_PUBLIC_URL=https://<account>.r2.cloudflarestorage.com/public/my-bucket \
 *     node scripts/sync-cloudflare-images.mjs
 *
 * Assets are read from this checkout when the real bytes exist here, and from the pinned CDN
 * snapshot otherwise; every upload is reported with the provider's own error, never swallowed.
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
const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

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

const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

function typeOf(relPath) {
  return TYPES[relPath.slice(relPath.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream";
}

/** The real bytes when the checkout has them, otherwise the pinned CDN snapshot. */
async function assetBytes(relPath) {
  const local = `public/img/${relPath}`;
  if (existsSync(local)) {
    return { body: new Uint8Array(readFileSync(local)), type: typeOf(relPath), source: "workspace" };
  }
  const response = await fetch(`${CDN_BASE}/${relPath}`);
  if (!response.ok) throw new Error(`source bytes unavailable (${response.status})`);
  return { body: new Uint8Array(await response.arrayBuffer()), type: typeOf(relPath), source: "pinned CDN" };
}

async function resolveAccountId() {
  if (process.env.CLOUDFLARE_ACCOUNT_ID?.trim()) return process.env.CLOUDFLARE_ACCOUNT_ID.trim();
  const res = await fetch(`${CF_API}/accounts?page=1&per_page=1`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const id = data?.result?.[0]?.id;
  if (!id) {
    throw new Error(
      "Could not resolve the Cloudflare Account ID. Pass CLOUDFLARE_ACCOUNT_ID=<32 chars> " +
      "(a token listing accounts needs the Account Settings: Read permission).",
    );
  }
  return id;
}

async function uploadToR2(accountId, relPath, asset) {
  const key = relPath.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(
    `${CF_API}/accounts/${accountId}/r2/buckets/${encodeURIComponent(bucket)}/objects/${key}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": asset.type },
      body: asset.body,
    },
  );
  return { status: res.status, text: (await res.text()).slice(0, 300) };
}

async function uploadToImages(accountId, relPath, asset) {
  const form = new FormData();
  form.set("id", relPath);
  form.set("requireSignedURLs", "false");
  form.set("file", new Blob([asset.body], { type: asset.type }), relPath);
  const res = await fetch(`${CF_API}/accounts/${accountId}/images/v1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await res.json().catch(() => null);
  return { status: res.status, ok: Boolean(payload?.success), payload };
}

async function main() {
  const accountId = await resolveAccountId();
  console.log(
    `Publishing ${CORE_IMAGES.length} assets to Cloudflare ` +
    `${bucket ? `R2 bucket “${bucket}”` : "Images"} (account ${accountId})...`,
  );

  const failures = new Set();
  for (const relPath of CORE_IMAGES) {
    let asset;
    try {
      asset = await assetBytes(relPath);
    } catch (error) {
      failures.add(relPath);
      console.log(`${relPath}: FAILED — ${error.message}`);
      continue;
    }

    if (bucket) {
      const { status, text } = await uploadToR2(accountId, relPath, asset);
      if (status >= 300) {
        failures.add(relPath);
        console.log(`${relPath}: FAILED ${status} ${text}`);
      } else {
        console.log(`${relPath}: uploaded ${asset.body.byteLength}b from ${asset.source}`);
      }
      continue;
    }

    const { status, ok, payload } = await uploadToImages(accountId, relPath, asset);
    if (!ok) {
      failures.add(relPath);
      const error = payload?.errors?.[0];
      console.log(`${relPath}: FAILED ${status} ${error?.code ?? ""} ${error?.message ?? "upload rejected"}`);
    } else {
      console.log(`${relPath}: uploaded from ${asset.source} → ${payload?.result?.variants?.[0] ?? "no variant url"}`);
    }
  }

  if (bucket && r2PublicUrl) {
    console.log(`\nReachability through the public bucket URL:`);
    for (const relPath of CORE_IMAGES) {
      const res = await fetch(`${r2PublicUrl}/${relPath}`).catch(() => null);
      if (!res || !res.ok) {
        failures.add(relPath);
        console.log(`${relPath}: NOT SERVED ${res?.status ?? "network error"}`);
      } else {
        console.log(`${relPath}: ${res.status} ${res.headers.get("content-type") ?? ""}`.trimEnd());
      }
    }
  }

  if (failures.size === 0) {
    console.log("\nAll assets published and verified.");
    if (bucket) {
      console.log(`Point the app at the bucket with CLOUDFLARE_R2_PUBLIC_URL=${r2PublicUrl || "<public bucket url>"}`);
    }
    return;
  }
  console.log(`\n${failures.size} asset(s) did not make it: ${[...failures].join(", ")}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message ?? String(err));
  console.error(
    bucket
      ? "R2 upload failed — the token needs the Account permission “Workers R2 Storage : Edit”."
      : "Images upload failed — error 5403 means this account has no Cloudflare Images subscription. " +
        "Either subscribe (Images → Get started), or run with CLOUDFLARE_R2_BUCKET to use R2 instead.",
    );
  process.exit(1);
});
