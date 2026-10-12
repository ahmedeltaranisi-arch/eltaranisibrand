import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { CatalogLineError, resolveCheckoutLine, type ResolvedCheckoutLine } from "@/lib/checkoutCatalog";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
const EXPRESS_FEE = 18;
const FREE_SHIPPING_THRESHOLD = 200;

/** Prices and color/size variants are always resolved from the server catalog. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("invalid_body");
    body = input;
  } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (rawLines.length === 0) return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  if (rawLines.length > 50) return NextResponse.json({ error: "too_many_lines" }, { status: 400 });
  let lines: ResolvedCheckoutLine[];
  try { lines = rawLines.map(resolveCheckoutLine); }
  catch (error) {
    if (error instanceof CatalogLineError) return NextResponse.json({ error: error.code }, { status: error.status });
    return NextResponse.json({ error: "invalid_cart" }, { status: 400 });
  }
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });

  const origin = new URL(request.url).origin;
  const locale = body.locale === "ar" ? "ar" : "en";
  const delivery = body.delivery === "express" ? "express" : "standard";
  const subtotal = lines.reduce((total, line) => total + line.price * line.qty, 0);
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = lines.map((line) => ({
    quantity: line.qty,
    price_data: { currency: "usd", unit_amount: Math.round(line.price * 100), product_data: {
      name: line.name, images: [`${origin}${line.image}`],
      metadata: { slug: line.slug, size: line.size, color: line.color, qty: String(line.qty) },
    } },
    // A fixed shipping decision must not be bypassed by editing quantities in
    // hosted checkout; quantity edits happen in the cart before re-pricing.
  }));
  const shipping = delivery === "express" ? EXPRESS_FEE : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 8;
  if (shipping > 0) items.push({ quantity: 1, price_data: { currency: "usd", unit_amount: shipping * 100, product_data: { name: "Shipping" } } });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment", line_items: items,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "DE", "FR", "EG", "AE", "SA", "AU"] },
      success_url: `${origin}/${locale}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout`,
      // Per-product variant metadata avoids Stripe’s 500-character session-value limit.
      metadata: { locale, delivery, lineCount: String(lines.length) },
      automatic_tax: { enabled: false },
    });
    return NextResponse.json({ url: session.url, id: session.id });
  } catch {
    // Provider errors can contain internal identifiers; never expose them.
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }
}
