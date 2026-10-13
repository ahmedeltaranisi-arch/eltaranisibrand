import { NextResponse } from "next/server";
import {
  cloudflareAssetRoot,
  EXTERNAL_ASSET_COMMIT,
  EXTERNAL_CDN_BASE,
  sanitizeImagePath,
  uploadImageToCloudflare,
} from "@/lib/imageApi";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    mode: "external-cdn",
    commit: EXTERNAL_ASSET_COMMIT,
    cdnBase: EXTERNAL_CDN_BASE,
    cloudflareConfigured: Boolean(process.env.CLOUDFLARE_API_TOKEN),
    // Which origin actually serves: the published asset root when configured, the mirrors otherwise.
    assetOrigin: cloudflareAssetRoot() ? `${cloudflareAssetRoot()}/img` : "mirrors",
  });
}

export async function POST(request: Request) {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ error: "cloudflare_not_configured" }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const id = typeof formData.get("id") === "string" ? String(formData.get("id")).trim() : undefined;

      if (!(file instanceof Blob) || file.size === 0) {
        return NextResponse.json({ error: "invalid_file" }, { status: 400 });
      }

      const filename = "name" in file && typeof file.name === "string" ? file.name : "upload";
      const result = await uploadImageToCloudflare({
        token,
        id,
        file,
        filename,
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: "cloudflare_upload_failed", details: result.payload?.errors ?? [] },
          { status: 502 },
        );
      }

      return NextResponse.json({
        uploaded: true,
        id: result.payload.result?.id,
        variants: result.payload.result?.variants ?? [],
      });
    }

    const body = (await request.json().catch(() => null)) as {
      path?: unknown;
      url?: unknown;
      id?: unknown;
    } | null;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    let sourceUrl: string | null = null;
    let customId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : undefined;

    if (typeof body.path === "string" && body.path.trim()) {
      const normalized = body.path.trim().replace(/^\/?(img\/)?/, "");
      const cleanPath = sanitizeImagePath(normalized);
      if (!cleanPath) {
        return NextResponse.json({ error: "invalid_image_path" }, { status: 400 });
      }
      sourceUrl = `${EXTERNAL_CDN_BASE}/${cleanPath}`;
      customId = customId ?? cleanPath;
    } else if (typeof body.url === "string" && /^https:\/\/.+/i.test(body.url.trim())) {
      sourceUrl = body.url.trim();
    }

    if (!sourceUrl) {
      return NextResponse.json({ error: "missing_image_source" }, { status: 400 });
    }

    const result = await uploadImageToCloudflare({
      token,
      id: customId,
      sourceUrl,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "cloudflare_upload_failed", details: result.payload?.errors ?? [] },
        { status: 502 },
      );
    }

    return NextResponse.json({
      uploaded: true,
      id: result.payload.result?.id,
      variants: result.payload.result?.variants ?? [],
    });
  } catch {
    return NextResponse.json({ error: "cloudflare_upstream_error" }, { status: 502 });
  }
}
