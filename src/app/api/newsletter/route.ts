import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * A provider webhook is deliberately server-side and optional. No fabricated
 * success, browser-only subscriber list, or API credential in client code.
 */
export async function POST(request: Request) {
  let input: { email?: unknown; source?: unknown };
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid_body");
    input = parsed;
  } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const endpoint = process.env.NEWSLETTER_WEBHOOK_URL;
  if (!endpoint) return NextResponse.json({ error: "newsletter_not_configured" }, { status: 503 });
  try {
    const provider = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json", ...(process.env.NEWSLETTER_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.NEWSLETTER_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ email, source: input.source === "offer" ? "offer" : "footer", consent: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!provider.ok) return NextResponse.json({ error: "provider_unavailable" }, { status: 502 });
    return NextResponse.json({ subscribed: true });
  } catch { return NextResponse.json({ error: "provider_unavailable" }, { status: 502 }); }
}
