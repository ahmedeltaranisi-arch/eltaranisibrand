/**
 * External image delivery & Cloudflare Images API integration.
 *
 * All storefront imagery is hosted externally (outside the project bundle) and
 * served through `/api/images/[...path]` (with `/img/:path*` rewritten to it)
 * with immutable 1-year edge cache headers.
 */

export const EXTERNAL_ASSET_COMMIT = "a3f459561f4ebe6ffc5047a3e434a002b2d717aa";
export const EXTERNAL_ASSET_REPO = "ahmedeltaranisi-arch/eltaranisibrand";

/** Cloudflare-backed global edge CDN (jsDelivr) serving the exact original bytes. */
export const EXTERNAL_CDN_BASE =
  process.env.EXTERNAL_IMAGE_CDN_BASE ??
  `https://cdn.jsdelivr.net/gh/${EXTERNAL_ASSET_REPO}@${EXTERNAL_ASSET_COMMIT}/public/img`;

/** Direct GitHub Raw CDN fallback. */
export const EXTERNAL_RAW_BASE =
  `https://raw.githubusercontent.com/${EXTERNAL_ASSET_REPO}/${EXTERNAL_ASSET_COMMIT}/public/img`;

/** GitHub REST API raw content endpoint (works in restricted egress environments). */
export const EXTERNAL_GH_API_BASE =
  `https://api.github.com/repos/${EXTERNAL_ASSET_REPO}/contents/public/img`;

export const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".ico", ".avif", ".gif"]);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export function sanitizeImagePath(input: string[] | string): string | null {
  const parts = (Array.isArray(input) ? input : input.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts.length === 0 || parts.length > 6) return null;

  for (const part of parts) {
    if (part === "." || part === ".." || !SAFE_SEGMENT.test(part)) {
      return null;
    }
  }

  const filename = parts[parts.length - 1];
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  const ext = filename.slice(dotIndex).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;

  return parts.join("/");
}

export function contentTypeForImage(cleanPath: string): string {
  const dotIndex = cleanPath.lastIndexOf(".");
  const ext = dotIndex >= 0 ? cleanPath.slice(dotIndex).toLowerCase() : "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export function resolveExternalImageSources(cleanPath: string): Array<{
  url: string;
  headers?: Record<string, string>;
  provider: string;
}> {
  const sources: Array<{ url: string; headers?: Record<string, string>; provider: string }> = [];

  const r2Base = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (r2Base) {
    sources.push({
      url: `${r2Base}/${cleanPath}`,
      provider: "cloudflare-r2",
    });
  }

  const cfDelivery = process.env.CLOUDFLARE_IMAGES_DELIVERY_URL?.replace(/\/+$/, "");
  if (cfDelivery) {
    sources.push({
      url: `${cfDelivery}/${cleanPath}/public`,
      provider: "cloudflare-images",
    });
  }

  sources.push(
    {
      url: `${EXTERNAL_CDN_BASE}/${cleanPath}`,
      provider: "cloudflare-jsdelivr-cdn",
    },
    {
      url: `${EXTERNAL_RAW_BASE}/${cleanPath}`,
      provider: "github-raw-cdn",
    },
    {
      url: `${EXTERNAL_GH_API_BASE}/${cleanPath}?ref=${EXTERNAL_ASSET_COMMIT}`,
      headers: {
        Accept: "application/vnd.github.raw",
        "User-Agent": "eltaranisibrand-image-api",
      },
      provider: "github-api-raw",
    },
  );

  return sources;
}

export async function resolveCloudflareAccountId(token: string): Promise<string> {
  const configured = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (configured) return configured;

  const response = await fetch(`${CLOUDFLARE_API_BASE}/accounts?page=1&per_page=1`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare accounts lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    success?: boolean;
    result?: Array<{ id?: string }>;
  };
  const accountId = data?.result?.[0]?.id;
  if (!accountId) {
    throw new Error("No Cloudflare account ID found for token");
  }
  return accountId;
}

export async function uploadImageToCloudflare(options: {
  token: string;
  accountId?: string;
  id?: string;
  sourceUrl?: string;
  file?: Blob;
  filename?: string;
}) {
  const accountId = options.accountId ?? (await resolveCloudflareAccountId(options.token));
  const form = new FormData();

  if (options.id) {
    form.set("id", options.id);
  }
  form.set("requireSignedURLs", "false");

  if (options.file) {
    form.set("file", options.file, options.filename ?? "image");
  } else if (options.sourceUrl) {
    form.set("url", options.sourceUrl);
  } else {
    throw new Error("Either file or sourceUrl is required");
  }

  const response = await fetch(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/images/v1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.token}`,
    },
    body: form,
    signal: AbortSignal.timeout(15000),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    result?: { id?: string; filename?: string; variants?: string[] };
    errors?: Array<{ code?: number; message?: string }>;
  };

  return {
    ok: response.ok && Boolean(payload?.success),
    status: response.status,
    payload,
  };
}
