# Firebase catalog → Supabase sync

Production Edge Function: `sync-firebase-catalog`.

Data flow:

`bounded inline catalog payload → sync-firebase-catalog → Supabase products/media_files/product_media → Storefront`

The storefront must use Supabase as its operational source of truth. Firebase CSV is an import/sync source only and must not be fetched by browser/storefront read paths.

## Scheduler

`.github/workflows/sync-firebase-catalog.yml` is a manual compatibility workflow for the retired Firebase import. Configure the same random `CATALOG_SYNC_SECRET` in Supabase Edge Function secrets and GitHub Actions secrets, plus `SUPABASE_ANON_KEY`. The Edge Function keeps JWT verification enabled and also requires the dedicated sync secret before using its service-role client.

## Production project

Project ref: `wtudcippyxbaobqzbmok`
Default tenant: `9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a`

## Safety

The importer is additive/updating. It does not delete products missing from a feed. Product matching is by `external_id` first, then slug. Media is de-duplicated by `tenant_id + file_url`, and product-media links are de-duplicated before insert.
