# New Arrivals reconstruction

## Catalog and photographs

- 107 genuine collection colorways, with 70 verified sibling colors (177 total).
- 883 local product photographs, plus real editorial photographs and textured fabric swatches.
- Unavailable colors/sizes are excluded from purchase choices; no tinted fallback photography.
- 48 products per page. Editorial blocks do not inflate product/result counts.
- Category, color and available-size counts are derived from the same dataset used to filter the grid. OR within a facet, AND between facets; facet counts exclude only their own selected facet.
- Featured, newest and best-selling orders use captured reference ranks. Price sorting uses numeric prices.
- English and Arabic supported; existing non-arrival pages keep their original theme.

## Run and verify

```sh
npm ci
npm run dev -- --hostname 0.0.0.0
npm run verify
npx playwright install --with-deps chromium
npm run test:e2e
```

Target route: `/en/collections/new-arrivals` (or `/ar/collections/new-arrivals`).
To test an already-running production server:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

## Newsletter integration

The form posts to `/api/newsletter`. Configure these **server-side** environment variables on the deployment:

- `NEWSLETTER_WEBHOOK_URL`: your email provider's subscription endpoint.
- `NEWSLETTER_WEBHOOK_TOKEN`: optional bearer authorization for that endpoint.

The endpoint receives JSON `{ "email": "…", "source": "footer" | "offer", "consent": true }`.
Success is returned only after the provider accepts the request. If no provider is configured, the form honestly reports temporary unavailability and the API returns HTTP 503. No email addresses or subscriber lists are stored in browser storage.

## Cart and payment

The cart persists locally and supports both imported arrival SKUs and pre-existing products. Current-locale labels are resolved on every render.
EGP/LE prices reproduce the recorded reference display; the accounting currency remains USD. `/api/checkout` validates the actual SKU, size, availability and quantity and resolves the canonical price on the server. Browser-supplied prices/colors are never trusted.

Real hosted payment requires the existing `STRIPE_SECRET_KEY` configuration. Without a payment provider, the existing storefront's explicitly labeled demo checkout remains a demo; this reconstruction does not claim to process real payments.

## Deployment

Push the completed commit to the existing GitHub repository's `main` branch to trigger the connected deployment. Check the new commit's deployment result and verify the production collection route. GitHub/Stripe/newsletter credentials must never be committed to the repository.
