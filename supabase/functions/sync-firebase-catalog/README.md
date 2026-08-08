# Firebase catalog → Supabase sync

Production Edge Function: `sync-firebase-catalog`.

Data flow:

`Firebase catalog.csv → sync-firebase-catalog → Supabase products/categories/media_files/product_media → Storefront`

The storefront must use Supabase as its operational source of truth. Firebase CSV is an import/sync source only and must not be fetched by browser/storefront read paths.

## Scheduler

`.github/workflows/sync-firebase-catalog.yml` invokes the protected Edge Function hourly and can also be run manually. Add repository secret `SUPABASE_ANON_KEY` using the production project's legacy anon JWT. The Edge Function keeps JWT verification enabled.

## Production project

Project ref: `wtudcippyxbaobqzbmok`
Default tenant: `9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a`

## Safety

The importer is additive/updating. It does not delete products missing from a feed. Product matching is by `external_id` first, then slug. Media is de-duplicated by `tenant_id + file_url`, and product-media links are de-duplicated before insert.
