/**
 * Catalog Seed Script
 * -------------------
 * Idempotent seed that copies the legacy `store-data.ts` catalog into the
 * `categories` + `products` tables. Runs only when a table is empty OR the
 * caller passes `FORCE_SEED=true`.
 *
 * NOTE: `store-data.ts` is intentionally KEPT — it remains the source for
 * the data-adapter fallback. This script only mirrors it into the DB so
 * the DB becomes the primary source.
 *
 * How to run:
 *   1. Manually from a privileged environment (server function or SQL editor).
 *   2. Via the `seedCatalog()` export below, called with an admin/service
 *      Supabase client. Never call from the browser.
 *
 * Behaviour:
 *   - Categories: upsert on `slug`, keeps existing custom edits (only fills
 *     missing rows unless FORCE_SEED).
 *   - Products: upsert on `slug`, links `category_id` by looking up the
 *     matching category slug in the DB.
 *   - Reports counts of inserted / skipped / failed rows.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { categories as seedCategories, products as seedProducts } from "@/lib/store-data";

export type SeedReport = {
  categories: { total: number; inserted: number; skipped: number; failed: number };
  products: { total: number; inserted: number; skipped: number; failed: number };
  errors: string[];
  ranAt: string;
  forced: boolean;
};

export interface SeedOptions {
  force?: boolean;
  log?: (msg: string) => void;
}

export async function seedCatalog(
  db: SupabaseClient<Database>,
  opts: SeedOptions = {},
): Promise<SeedReport> {
  const force = opts.force ?? process.env.FORCE_SEED === "true";
  const log = opts.log ?? ((m) => console.log(`[seed] ${m}`));
  const report: SeedReport = {
    categories: { total: seedCategories.length, inserted: 0, skipped: 0, failed: 0 },
    products: { total: seedProducts.length, inserted: 0, skipped: 0, failed: 0 },
    errors: [],
    ranAt: new Date().toISOString(),
    forced: force,
  };

  // Resolve target tenant (default: 'default' tenant for backward-compat)
  const { data: tenantRow, error: tenantErr } = await db
    .from("tenants")
    .select("id")
    .eq("slug", "default")
    .maybeSingle();
  if (tenantErr) throw tenantErr;
  if (!tenantRow) throw new Error("Default tenant missing — run SaaS migration first.");
  const tenantId = tenantRow.id;

  // ---------- Categories ----------
  const { count: catCount, error: catCountErr } = await db
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (catCountErr) throw catCountErr;

  if ((catCount ?? 0) > 0 && !force) {
    log(`categories(default) has ${catCount} rows — skipping (pass force:true to override).`);
    report.categories.skipped = report.categories.total;
  } else {
    const rows = seedCategories.map((c, i) => ({
      tenant_id: tenantId,
      slug: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      sort: i,
      is_active: true,
    }));
    const { data, error } = await db
      .from("categories")
      .upsert(rows, { onConflict: "tenant_id,slug", ignoreDuplicates: false })
      .select("id, slug");
    if (error) {
      report.errors.push(`categories: ${error.message}`);
      report.categories.failed = rows.length;
    } else {
      report.categories.inserted = data?.length ?? 0;
      log(`categories upserted: ${report.categories.inserted}`);
    }
  }

  // ---------- Products ----------
  const { data: catMap, error: mapErr } = await db
    .from("categories")
    .select("id, slug")
    .eq("tenant_id", tenantId);
  if (mapErr) throw mapErr;
  const slugToId = new Map((catMap ?? []).map((c) => [c.slug, c.id]));

  const { count: prodCount, error: prodCountErr } = await db
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (prodCountErr) throw prodCountErr;

  if ((prodCount ?? 0) > 0 && !force) {
    log(`products(default) has ${prodCount} rows — skipping (pass force:true to override).`);
    report.products.skipped = report.products.total;
  } else {
    const rows = seedProducts.map((p) => ({
      tenant_id: tenantId,
      slug: p.slug,
      name: p.name,
      description: p.description,
      price: p.price,
      old_price: p.oldPrice ?? null,
      currency: "YER",
      category_id: slugToId.get(p.categoryId) ?? null,
      images: [p.image],
      stock: p.stock,
      rating: p.rating,
      reviews_count: p.reviews,
      tags: p.badge ? [p.badge] : [],
      badge: p.badge ?? null,
      is_published: true,
    }));
    const { data, error } = await db
      .from("products")
      .upsert(rows, { onConflict: "tenant_id,slug", ignoreDuplicates: false })
      .select("id, slug");
    if (error) {
      report.errors.push(`products: ${error.message}`);
      report.products.failed = rows.length;
    } else {
      report.products.inserted = data?.length ?? 0;
      log(`products upserted: ${report.products.inserted}`);
    }
  }

  log(
    `done — categories(inserted=${report.categories.inserted}, skipped=${report.categories.skipped}), ` +
      `products(inserted=${report.products.inserted}, skipped=${report.products.skipped}), ` +
      `errors=${report.errors.length}`,
  );
  return report;
}
