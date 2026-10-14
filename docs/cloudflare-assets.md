# Storefront imagery on Cloudflare (free plan)

Every image the storefront shows is published to a **Cloudflare Workers Static Assets** deployment
named `eltaranisi-images`, which serves the repository's `public/img` tree — 1,322 files, 31.8 MiB —
from Cloudflare's edge:

```
https://eltaranisi-images.ahmedeltaranisi.workers.dev/img/<same-path-as-the-repository>
```

This needs no subscription and no payment card, unlike Cloudflare Images (error `5403` on every
upload while the account has no Images plan) or R2 (Cloudflare asks for a card to enable it).

## Resolution order

`src/lib/imageApi.ts` → `resolveExternalImageSources()` builds the chain the proxy
(`src/app/api/images/[...path]/route.ts`) walks, stopping at the first hit:

1. `cloudflare-assets` — the worker above, so the published bytes are the origin.
2. `cloudflare-images` — only when `CLOUDFLARE_IMAGES_DELIVERY_URL` is set.
3. `cloudflare-jsdelivr-cdn`, `github-raw-cdn`, `github-api-raw` — mirrors of the pinned commit
   `a3f45956`, so the site keeps rendering if the worker is ever unreachable.

Each response carries `X-Image-Provider`, which is how a live check names the origin that answered.

Environment switches: `CLOUDFLARE_ASSETS_PUBLIC_URL` (any https root holding `img/...`),
`CLOUDFLARE_R2_PUBLIC_URL` (accepted as an alias for an R2 bucket), `CLOUDFLARE_ASSETS_DISABLED=1`
(uses the mirrors only). A value that is set but not `https://` is treated as a visible
misconfiguration and disables the origin rather than falling back to the default.

## Republishing

```bash
CLOUDFLARE_ASSETS_FULL=1 \
CLOUDFLARE_WORKERS_PROJECT=eltaranisi-images \
CLOUDFLARE_WORKERS_SUBDOMAIN=ahmedeltaranisi \
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... \
  node scripts/sync-cloudflare-images.mjs
```

The script stages the bytes (checkout first, pinned CDN otherwise), deploys with `wrangler`, then
fetches **every** asset back over the public URL and fails if one is missing — a deployment that
silently serves 404s is worse than one that errors. Add `--dry-run` to stage without publishing.
The token needs the account permission `Workers Scripts : Edit`.

Last published run: 1,322 assets staged, `1322 200`, 0 byte mismatches against the staged sizes.

Refreshed with the account token that grants `Workers Scripts : Edit`: the whole tree — the 350
images the checkout holds plus the 933 the pinned snapshot carries, 1,283 storefront photographs —
was re-staged and republished, and all 2,946 objects at
`https://eltaranisi-images.ahmedeltaranisi.workers.dev/img/...` were fetched back over the public
URL and answered 200.

Cloudflare **Images** (the `imagedelivery.net` product) still answers `5403 The given account is
not valid or is not authorized to access this service` for every upload until the Images
subscription is activated on the account; `direct_upload` alone succeeds, the upload itself does
not. Static Assets on the Workers free plan is what this storefront publishes to.
