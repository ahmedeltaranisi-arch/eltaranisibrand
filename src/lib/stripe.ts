import Stripe from "stripe";

/**
 * Server-only Stripe client. Returns null when no secret key is configured so
 * the storefront still runs (and the checkout falls back to the demo flow)
 * instead of throwing at import time.
 */
let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  cached = key && key.startsWith("sk_") ? new Stripe(key) : null;
  return cached;
}

export function stripeEnabled(): boolean {
  return getStripe() !== null;
}
