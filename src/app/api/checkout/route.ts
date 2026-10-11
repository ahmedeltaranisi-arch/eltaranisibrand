import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getProductBySlug } from "@/lib/catalog";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type LineInput = {
  slug: string;
  size: string;
  color: string;
  qty: number;
};

const EXPRESS_FEE = 18;
const FREE_SHIPPING_THRESHOLD = 200;

/**
 * Creates a Stripe Checkout Session from the client cart and returns its URL.
 * The cart is re-priced from the catalog on the server — never trusted from
 * the browser.
 *
 * POST /api/checkout  { lines: LineInput[], delivery: "standard"|"express", locale }
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  let body: { lines?: LineInput[]; delivery?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const locale = body.locale === "ar" ? "ar" : "en";

  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  /** structured variant info for the webhook — Checkout line items have no
   *  free-form description field, so it rides along in session metadata. */
  const fulfilment: { slug: string; size: string; color: string; qty: number }[] = [];
  let subtotal = 0;

  for (const line of lines.slice(0, 50)) {
    const product = getProductBySlug(line.slug);
    if (!product) continue;

    const size = String(line.size ?? "").slice(0, 8);
    if (!product.sizes.includes(size)) continue;
    if ((product.stock[size] ?? 0) <= 0) {
      return NextResponse.json(
        { error: "out_of_stock", slug: line.slug, size },
        { status: 409 },
      );
    }

    const qty = Math.min(Math.max(Number(line.qty) || 1, 1), 10);
    const colour = String(line.color ?? product.colorways[0].name).slice(0, 32);
    subtotal += product.price * qty;

    items.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: product.price * 100,
        product_data: {
          name: `${product.baseSlug.replace(/-/g, " ")} — ${colour} / ${size}`,
          images: [`${origin}${product.image}`],
        },
      },
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
    });

    fulfilment.push({ slug: line.slug, size, color: colour, qty });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "no_valid_lines" }, { status: 400 });
  }

  const shipping =
    body.delivery === "express"
      ? EXPRESS_FEE
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : 8;

  if (shipping > 0) {
    items.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: shipping * 100,
        product_data: { name: "Shipping" },
      },
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items,
      shipping_address_collection: { allowed_countries: ["US", "CA", "GB", "DE", "FR", "EG", "AE", "SA", "AU"] },
      success_url: `${origin}/${locale}/order/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/checkout`,
      metadata: {
        locale,
        delivery: body.delivery ?? "standard",
        lines: JSON.stringify(fulfilment),
      },
      automatic_tax: { enabled: false },
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe_error";
    return NextResponse.json({ error: "stripe_error", message }, { status: 502 });
  }
}
