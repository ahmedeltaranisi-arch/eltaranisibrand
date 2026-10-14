#!/usr/bin/env node
/**
 * Publishes the storefront images to Cloudflare, so the app can serve them from a Cloudflare
 * origin instead of shipping them inside the deploy bundle.
 *
 *   # Workers Static Assets — free plan, no subscription and no payment card
 *   CLOUDFLARE_ASSETS_FULL=1 CLOUDFLARE_WORKERS_PROJECT=eltaranisi-images \
 *   CLOUDFLARE_WORKERS_SUBDOMAIN=ahmedeltaranisi \
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/sync-cloudflare-images.mjs
 *
 * The command actually used for this storefront: the whole `public/img` tree (1,322 files) is
 * published to the `eltaranisi-images` worker and served from
 * `https://eltaranisi-images.ahmedeltaranisi.workers.dev/img/...`, which `src/lib/imageApi.ts`
 * keeps as its default origin (`CLOUDFLARE_ASSETS_PUBLIC_URL` overrides it,
 * `CLOUDFLARE_ASSETS_DISABLED=1` falls back to the mirrors).
 *
 *   # Cloudflare R2 (free tier, but Cloudflare asks for a card to enable the product)
 *   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... CLOUDFLARE_R2_BUCKET=my-bucket \
 *   CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxx.r2.dev node scripts/sync-cloudflare-images.mjs
 *
 *   # Cloudflare Images (needs a paid Images subscription on the account)
 *   CLOUDFLARE_API_TOKEN=... [CLOUDFLARE_ACCOUNT_ID=...] node scripts/sync-cloudflare-images.mjs
 *
 * Add `CLOUDFLARE_ASSETS_FULL=1` to publish every file of `public/img` (rails, editorial block,
 * all 107 colourways) instead of only the core set, and `--dry-run` to download and stage the
 * bytes without touching Cloudflare — that is the mode to check the path mapping in.
 *
 * Assets are read from this checkout when the real bytes exist here and from the pinned CDN
 * snapshot otherwise; every upload is reported with the provider's own error, never swallowed.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const COMMIT = "017d424f64277189a9b034a216970fc8db5e4e87";
const REPO = "ahmedeltaranisi-arch/eltaranisibrand";
const CDN_BASE = `https://cdn.jsdelivr.net/gh/${REPO}@${COMMIT}/public/img`;
const CF_API = "https://api.cloudflare.com/client/v4";
const STAGE = ".cloudflare-assets";
const DRY_RUN = process.argv.includes("--dry-run");

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token && !DRY_RUN) {
  console.error("Missing CLOUDFLARE_API_TOKEN environment variable.");
  process.exit(1);
}
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
const workerProject = process.env.CLOUDFLARE_WORKERS_PROJECT?.trim();
const workerSubdomain = process.env.CLOUDFLARE_WORKERS_SUBDOMAIN?.trim();
const publicUrl = (process.env.CLOUDFLARE_ASSETS_PUBLIC_URL ?? process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

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

const typeOf = (relPath) => TYPES[relPath.slice(relPath.lastIndexOf(".")).toLowerCase()] ?? "application/octet-stream";

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

/** Every image this checkout holds under `public/img`, whatever the pinned snapshot knows of. */
function localImagePaths() {
  const walk = (dir, prefix) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(join(dir, entry.name), `${prefix}${entry.name}/`)
        : TYPES[`.${entry.name.split(".").pop()?.toLowerCase()}`]
          ? [`${prefix}${entry.name}`]
          : [],
    );
  return existsSync("public/img") ? walk("public/img", "") : [];
}

/** Every image the storefront references: the pinned commit's tree plus this checkout's own. */
async function allSiteImages() {
  const url = `https://api.github.com/repos/${REPO}/git/trees/${COMMIT}:public/img?recursive=1`;
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", "User-Agent": "eltaranisi-sync" } });
  if (!response.ok) throw new Error(`could not list the mirror tree (${response.status})`);
  const tree = (await response.json()).tree ?? [];
  const mirrored = tree
    .filter((entry) => entry.type === "blob" && TYPES[`.${entry.path.split(".").pop()?.toLowerCase()}`])
    .map((entry) => entry.path);
  // A checkout can hold photography the snapshot predates; those bytes come from the workspace.
  return [...new Set([...mirrored, ...localImagePaths()])];
}

async function resolveAccountId() {
  if (accountId) return accountId;
  const res = await fetch(`${CF_API}/accounts?page=1&per_page=1`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => null);
  const id = data?.result?.[0]?.id;
  if (!id) {
    throw new Error("Could not resolve the Cloudflare Account ID. Pass CLOUDFLARE_ACCOUNT_ID=<32 chars>.");
  }
  return id;
}

function stageFile(relPath, asset) {
  const target = join(STAGE, "public", "img", relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, asset.body);
}

async function uploadToR2(account, relPath, asset) {
  const key = `img/${relPath}`.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${CF_API}/accounts/${account}/r2/buckets/${encodeURIComponent(bucket)}/objects/${key}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": asset.type },
    body: asset.body,
  });
  return { ok: res.ok, detail: res.ok ? "" : (await res.text()).slice(0, 200) };
}

async function uploadToImages(account, relPath, asset) {
  const form = new FormData();
  form.set("id", `img/${relPath}`);
  form.set("requireSignedURLs", "false");
  form.set("file", new Blob([asset.body], { type: asset.type }), relPath);
  const res = await fetch(`${CF_API}/accounts/${account}/images/v1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await res.json().catch(() => null);
  return { ok: Boolean(payload?.success), detail: payload?.errors?.[0] ? `${payload.errors[0].code} ${payload.errors[0].message}` : `status ${res.status}` };
}

/** Static Assets need no Worker script; wrangler publishes the staged folder as-is. */
function deployWorker(project) {
  writeFileSync(
    join(STAGE, "wrangler.jsonc"),
    `${JSON.stringify(
      { name: project, compatibility_date: "2026-10-01", assets: { directory: "./public", not_found_handling: "none" } },
      null,
      2,
    )}\n`,
  );
  const run = spawnSync("npx", ["--yes", "wrangler", "deploy", "--config", join(STAGE, "wrangler.jsonc")], {
    encoding: "utf8",
    env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID },
    timeout: 600_000,
  });
  const out = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim();
  if (run.error) return { ok: false, detail: run.error.message };
  return { ok: run.status === 0, detail: out.slice(-1200) };
}

async function main() {
  const mode = workerProject ? "workers" : bucket ? "r2" : "images";
  let relPaths = [...CORE_IMAGES];
  if (process.env.CLOUDFLARE_ASSETS_FULL === "1") {
    relPaths = [...new Set([...relPaths, ...(await allSiteImages())])];
  }
  console.log(`Mode “${mode}”${DRY_RUN ? " (dry run)" : ""}: staging ${relPaths.length} asset(s)...`);

  rmSync(STAGE, { recursive: true, force: true });
  const failures = new Set();
  let bytes = 0;
  for (const relPath of relPaths) {
    try {
      const asset = await assetBytes(relPath);
      bytes += asset.body.byteLength;
      stageFile(relPath, asset);
      console.log(`${relPath}: staged ${asset.body.byteLength}b from ${asset.source}`);
    } catch (error) {
      failures.add(relPath);
      console.log(`${relPath}: FAILED — ${error.message}`);
    }
  }
  console.log(`Staged ${(bytes / 1048576).toFixed(1)} MiB into ${STAGE}/public/img.`);
  if (DRY_RUN) {
    console.log(failures.size ? `${failures.size} asset(s) could not be read.` : "Dry run complete — nothing was uploaded.");
    process.exitCode = failures.size ? 1 : 0;
    return;
  }

  const account = await resolveAccountId();
  for (const relPath of relPaths) {
    if (failures.has(relPath)) continue;
    const asset = { body: new Uint8Array(readFileSync(join(STAGE, "public", "img", relPath))), type: typeOf(relPath) };
    const result =
      mode === "workers"
        ? { ok: true, detail: "published by wrangler below" }
        : mode === "r2"
          ? await uploadToR2(account, relPath, asset)
          : await uploadToImages(account, relPath, asset);
    if (!result.ok) {
      failures.add(relPath);
      console.log(`${relPath}: REJECTED — ${result.detail}`);
    }
  }

  if (mode === "workers") {
    console.log(`Deploying “${workerProject}” with Static Assets...`);
    const deployed = deployWorker(workerProject);
    if (!deployed.ok) {
      console.log(`wrangler failed — ${deployed.detail}`);
      console.log(`If it asked for a main module, deploy is a one-line change: ${STAGE}/wrangler.jsonc needs "main": "worker.js".`);
      process.exit(1);
    }
    console.log(deployed.detail.split("\n").slice(-6).join("\n"));
  }

  const origin = publicUrl || (mode === "workers" && workerSubdomain ? `https://${workerProject}.${workerSubdomain}.workers.dev` : "");
  if (!origin) {
    console.log("Uploaded. Set CLOUDFLARE_ASSETS_PUBLIC_URL to the bucket/worker public root to serve it.");
    if (failures.size) process.exitCode = 1;
    return;
  }
  console.log(`Verifying every asset through ${origin}/img/...`);
  // A fresh deployment needs a few seconds before the route answers, so a miss is retried.
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  let served = 0;
  for (const relPath of relPaths) {
    if (failures.has(relPath)) continue;
    let status = 0;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const res = await fetch(`${origin}/img/${relPath}`, { cache: "no-store" }).catch(() => null);
      status = res?.status ?? 0;
      if (res?.ok) break;
      await new Promise((resolve) => setTimeout(resolve, 5_000 * (attempt + 1)));
    }
    if (status >= 200 && status < 300) served += 1;
    else {
      failures.add(relPath);
      console.log(`${relPath}: NOT SERVED ${status || "network error"}`);
    }
  }
  if (failures.size === 0) {
    console.log(`\nAll ${relPaths.length} assets published and reachable. Point the app at:`);
    console.log(`  CLOUDFLARE_ASSETS_PUBLIC_URL=${origin}`);
    return;
  }
  console.log(`\n${failures.size} asset(s) did not make it (${served} verified good).`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message ?? String(err));
  console.error(
    "Fix the reported line and re-run. Common cases: error 5403 = the account has no Cloudflare Images " +
    "subscription; code 10000 = the token lacks the permission this mode needs " +
    "(Workers Scripts: Edit for Workers, Workers R2 Storage: Edit for R2, Cloudflare Images: Edit for Images).",
  );
  process.exit(1);
});
