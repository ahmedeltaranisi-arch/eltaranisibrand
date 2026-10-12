import assert from "node:assert/strict";
import test from "node:test";
import { POST as newsletter } from "../src/app/api/newsletter/route";
import { POST as checkout } from "../src/app/api/checkout/route";
import { mateNewArrivals } from "../src/lib/mateNewArrivals";

const request = (route: string, body: unknown) => new Request(`https://store.example/api/${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("newsletter rejects malformed input without subscribing", async () => {
  for (const body of [null, [], {}, { email: "bad" }, { email: "x".repeat(260) + "@example.com" }]) assert.equal((await newsletter(request("newsletter", body))).status, 400);
});

test("newsletter reports a missing provider honestly, never a fake success", async () => {
  const previous = process.env.NEWSLETTER_WEBHOOK_URL;
  delete process.env.NEWSLETTER_WEBHOOK_URL;
  try {
    const response = await newsletter(request("newsletter", { email: "qa@example.com" }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "newsletter_not_configured" });
  } finally { if (previous) process.env.NEWSLETTER_WEBHOOK_URL = previous; }
});

test("configured newsletter forwards consent and reports success only after provider acceptance", async () => {
  const previousURL = process.env.NEWSLETTER_WEBHOOK_URL;
  const previousToken = process.env.NEWSLETTER_WEBHOOK_TOKEN;
  const previousFetch = globalThis.fetch;
  process.env.NEWSLETTER_WEBHOOK_URL = "https://provider.example/subscribe";
  process.env.NEWSLETTER_WEBHOOK_TOKEN = "unit-test-token";
  let payload: unknown;
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "https://provider.example/subscribe");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer unit-test-token");
    assert.ok(init?.signal);
    payload = JSON.parse(String(init?.body));
    return new Response("", { status: 202 });
  };
  try {
    const response = await newsletter(request("newsletter", { email: " QA@EXAMPLE.COM ", source: "offer" }));
    assert.equal(response.status, 200);
    assert.deepEqual(payload, { email: "qa@example.com", source: "offer", consent: true });
    assert.deepEqual(await response.json(), { subscribed: true });
    globalThis.fetch = async () => new Response("", { status: 500 });
    assert.equal((await newsletter(request("newsletter", { email: "qa@example.com" }))).status, 502);
    globalThis.fetch = async () => { throw new Error("test timeout"); };
    assert.equal((await newsletter(request("newsletter", { email: "qa@example.com" }))).status, 502);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousURL) process.env.NEWSLETTER_WEBHOOK_URL = previousURL; else delete process.env.NEWSLETTER_WEBHOOK_URL;
    if (previousToken) process.env.NEWSLETTER_WEBHOOK_TOKEN = previousToken; else delete process.env.NEWSLETTER_WEBHOOK_TOKEN;
  }
});

test("checkout rejects invalid variants/quantities and does not silently drop invalid cart lines", async () => {
  const p = mateNewArrivals[0];
  const valid = { slug: p.slug, size: p.availableSizes[0], qty: 1 };
  for (const body of [null, { lines: [] }, { lines: [{ ...valid, slug: "unknown" }] }, { lines: [{ ...valid, size: "invalid" }] }, { lines: [{ ...valid, qty: 1.2 }] }, { lines: Array.from({ length: 51 }, () => valid) }, { lines: [valid, { ...valid, slug: "unknown" }] }]) {
    assert.equal((await checkout(request("checkout", body))).status, 400);
  }
});

test("imported products pass server validation; missing payment configuration is explicit", async () => {
  const previous = process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_SECRET_KEY;
  const p = mateNewArrivals[0];
  try {
    const response = await checkout(request("checkout", { locale: "en", lines: [{ slug: p.slug, size: p.availableSizes[0], qty: 1, price: 0.01 }] }));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: "stripe_not_configured" });
  } finally { if (previous) process.env.STRIPE_SECRET_KEY = previous; }
});
