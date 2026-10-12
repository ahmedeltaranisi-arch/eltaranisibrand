import { getColorway, getProductBySlug } from "./catalog";
import { getArrivalProduct } from "./mateNewArrivals";

export class CatalogLineError extends Error {
  constructor(public code: string, public status: number = 400) { super(code); }
}

export type ResolvedCheckoutLine = {
  slug: string;
  size: string;
  color: string;
  qty: number;
  /** Canonical catalog price in USD — no browser-supplied price accepted. */
  price: number;
  name: string;
  image: string;
  maxQuantity: number;
};

/** Shared, independently testable server-side variant validation/repricing. */
export function resolveCheckoutLine(input: unknown): ResolvedCheckoutLine {
  if (!input || typeof input !== "object") throw new CatalogLineError("invalid_line");
  const raw = input as Record<string, unknown>;
  if (typeof raw.slug !== "string" || typeof raw.size !== "string") throw new CatalogLineError("invalid_variant");
  if (typeof raw.qty !== "number" || !Number.isSafeInteger(raw.qty) || raw.qty < 1 || raw.qty > 10) throw new CatalogLineError("invalid_quantity");
  const { slug, size, qty } = raw as { slug: string; size: string; qty: number };
  const arrival = getArrivalProduct(slug);
  if (arrival) {
    if (!arrival.sizes.includes(size)) throw new CatalogLineError("invalid_size");
    if (!arrival.availableSizes.includes(size)) throw new CatalogLineError("out_of_stock", 409);
    return { slug, size, qty, color: arrival.color.label, price: arrival.priceUSD,
      name: `${arrival.title} — ${arrival.color.label} / ${size}`, image: arrival.images[0], maxQuantity: 10 };
  }
  const product = getProductBySlug(slug);
  const colorway = getColorway(slug);
  if (!product || !colorway) throw new CatalogLineError("invalid_product");
  if (!product.sizes.includes(size)) throw new CatalogLineError("invalid_size");
  const stock = product.stock[size] ?? 0;
  if (stock < qty) throw new CatalogLineError("out_of_stock", 409);
  return { slug, size, qty, color: colorway.name, price: product.price,
    name: `${product.baseSlug.replace(/-/g, " ")} — ${colorway.name} / ${size}`, image: product.image, maxQuantity: Math.min(stock, 10) };
}
