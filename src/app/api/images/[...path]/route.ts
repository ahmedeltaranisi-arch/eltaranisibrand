import { NextResponse } from "next/server";
import {
  contentTypeForImage,
  resolveExternalImageSources,
  sanitizeImagePath,
} from "@/lib/imageApi";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
  "Access-Control-Allow-Origin": "*",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const cleanPath = sanitizeImagePath(path);

  if (!cleanPath) {
    return NextResponse.json({ error: "invalid_image_path" }, { status: 400 });
  }

  const sources = resolveExternalImageSources(cleanPath);
  let sawNotFound = false;

  for (const source of sources) {
    try {
      const upstream = await fetch(source.url, {
        headers: source.headers,
        signal: AbortSignal.timeout(8000),
      });

      if (upstream.status === 404) {
        sawNotFound = true;
        continue;
      }

      if (!upstream.ok || !upstream.body) {
        continue;
      }

      const bytes = await upstream.arrayBuffer();
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          ...CACHE_HEADERS,
          "Content-Type": contentTypeForImage(cleanPath),
          "X-Image-Provider": source.provider,
        },
      });
    } catch {
      // Try next external CDN provider in fallback chain.
    }
  }

  if (sawNotFound) {
    return NextResponse.json({ error: "image_not_found", path: cleanPath }, { status: 404 });
  }

  return NextResponse.json({ error: "image_upstream_unavailable", path: cleanPath }, { status: 502 });
}
