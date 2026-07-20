/**
 * Admin-only server function: import products from a remote CSV catalog.
 * Upserts on (tenant_id, external_id). Uses context.supabase (RLS as admin/tenant member).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { getRequest } from "@tanstack/react-start/server";

// -------- CSV parser (RFC 4180-ish; handles quoted fields, escaped quotes, CRLF) --------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else cur += c;
    }
  }
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row); }
  return rows;
}

function slugify(input: string, fallback: string): string {
  const base = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return base || fallback;
}

// "18500.00 YER" → { price: 18500, currency: "YER" }
function parsePrice(raw: string): { price: number; currency: string } {
  const s = (raw || "").trim();
  if (!s) return { price: 0, currency: "YER" };
  const m = s.match(/([\d.,]+)\s*([A-Za-z]{3})?/);
  const price = m ? Number(m[1].replace(/,/g, "")) : 0;
  return { price: Number.isFinite(price) ? price : 0, currency: (m?.[2] || "YER").toUpperCase() };
}

const resolveAdminTenant = async (
  ctx: { supabase: SupabaseClient<Database>; userId: string },
  override?: string | null,
): Promise<string> => {
  let headers: Headers | null = null;
  try { headers = getRequest().headers; } catch { /* no request ctx */ }
  return resolveTenantId(ctx.supabase, { override, headers, userId: ctx.userId });
};

export const adminImportCatalogFromUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      url: z.string().url(),
      tenantId: z.string().uuid().optional(),
      publish: z.boolean().default(true),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    // admin check
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw roleErr;
    if (!isAdmin) throw new Error("Forbidden: admin required");

    const tenantId = await resolveAdminTenant(context, data.tenantId);

    const res = await fetch(data.url);
    if (!res.ok) throw new Error(`Failed to fetch CSV (${res.status})`);
    const text = await res.text();
    const rows = parseCsv(text);
    if (rows.length < 2) throw new Error("CSV is empty");

    const header = rows[0].map((h) => h.trim());
    const col = (name: string) => header.indexOf(name);
    const idIdx = col("id");
    const titleIdx = col("title");
    const descIdx = col("description");
    const availIdx = col("availability");
    const condIdx = col("condition");
    const priceIdx = col("price");
    const linkIdx = col("link");
    const imageIdx = col("image_link");
    const brandIdx = col("brand");
    const qtyIdx = col("quantity_to_sell_on_facebook");

    // V2 additional columns
    const skuIdx = col("sku");
    const barcodeIdx = header.findIndex(h => h === "gtin" || h === "barcode");
    const salePriceIdx = col("sale_price");
    const costPriceIdx = col("cost_price");
    const colorIdx = col("color");
    const sizeIdx = col("size");
    const gcatIdx = col("google_product_category");
    const fbcatIdx = col("fb_product_category");
    const materialIdx = col("material");
    const patternIdx = col("pattern");
    const genderIdx = col("gender");
    const ageGroupIdx = col("age_group");

    if (titleIdx < 0 || priceIdx < 0 || imageIdx < 0) {
      throw new Error("CSV missing required columns (title, price, image_link)");
    }

    type Insert = Database["public"]["Tables"]["products"]["Insert"];

    const seenSlugs = new Set<string>();
    const records: Insert[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => !c?.trim())) continue;
      const title = (row[titleIdx] || "").trim();
      if (!title) continue;
      const externalId = idIdx >= 0 ? (row[idIdx] || "").trim() || null : null;
      
      const { price: regPrice } = parsePrice(row[priceIdx] || "");
      const { price: salePrice } = salePriceIdx >= 0 ? parsePrice(row[salePriceIdx] || "") : { price: 0 };
      const { price: costPrice } = costPriceIdx >= 0 ? parsePrice(row[costPriceIdx] || "") : { price: 0 };

      let price = regPrice;
      let compareAtPrice: number | null = null;
      if (salePrice > 0 && salePrice < regPrice) {
        price = salePrice;
        compareAtPrice = regPrice;
      }

      const image = (row[imageIdx] || "").trim();
      const stockRaw = qtyIdx >= 0 ? Number((row[qtyIdx] || "").trim()) : NaN;
      const stock = Number.isFinite(stockRaw) && stockRaw >= 0 ? Math.floor(stockRaw) : 0;

      let slug = slugify(title, externalId ?? `product-${r}`);
      let uniq = slug;
      let i = 2;
      while (seenSlugs.has(uniq)) { uniq = `${slug}-${i++}`.slice(0, 60); }
      seenSlugs.add(uniq);
      slug = uniq;

      // Extract metadata tags
      const tags: string[] = [];
      const color = colorIdx >= 0 ? (row[colorIdx] || "").trim() : "";
      const size = sizeIdx >= 0 ? (row[sizeIdx] || "").trim() : "";
      const gcat = gcatIdx >= 0 ? (row[gcatIdx] || "").trim() : "";
      const fbcat = fbcatIdx >= 0 ? (row[fbcatIdx] || "").trim() : "";
      const material = materialIdx >= 0 ? (row[materialIdx] || "").trim() : "";
      const pattern = patternIdx >= 0 ? (row[patternIdx] || "").trim() : "";
      const gender = genderIdx >= 0 ? (row[genderIdx] || "").trim() : "";
      const ageGroup = ageGroupIdx >= 0 ? (row[ageGroupIdx] || "").trim() : "";

      if (color) tags.push(`_color:${color}`);
      if (size) tags.push(`_size:${size}`);
      if (gcat) tags.push(`_gcat:${gcat}`);
      if (fbcat) tags.push(`_fbcat:${fbcat}`);
      if (material) tags.push(`_material:${material}`);
      if (pattern) tags.push(`_pattern:${pattern}`);
      if (gender) tags.push(`_gender:${gender}`);
      if (ageGroup) tags.push(`_age:${ageGroup}`);

      records.push({
        tenant_id: tenantId,
        slug,
        name: title,
        description: (descIdx >= 0 ? row[descIdx] : "") || "",
        price,
        compare_at_price: compareAtPrice,
        cost_price: costPrice > 0 ? costPrice : null,
        currency: "YER",
        images: image ? [image] : [],
        stock,
        brand: (brandIdx >= 0 ? (row[brandIdx] || "").trim() : "") || null,
        is_published: data.publish,
        external_id: externalId,
        availability: (availIdx >= 0 ? (row[availIdx] || "").trim() : "") || null,
        condition: (condIdx >= 0 ? (row[condIdx] || "").trim() : "") || null,
        source_url: (linkIdx >= 0 ? (row[linkIdx] || "").trim() : "") || null,
        sku: skuIdx >= 0 ? (row[skuIdx] || "").trim() || null : null,
        barcode: barcodeIdx >= 0 ? (row[barcodeIdx] || "").trim() || null : null,
        tags,
      });
    }

    if (records.length === 0) {
      return { inserted: 0, updated: 0, total: 0 };
    }

    // Partition: rows with external_id → upsert by (tenant_id, external_id).
    // Rows without → plain insert (slug conflict tolerated by ignoreDuplicates).
    const withExt = records.filter((r) => r.external_id);
    const withoutExt = records.filter((r) => !r.external_id);

    let processed = 0;

    if (withExt.length) {
      const { error, count } = await context.supabase
        .from("products")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(withExt as any, { onConflict: "tenant_id,external_id", count: "exact" });
      if (error) throw error;
      processed += count ?? withExt.length;
    }

    if (withoutExt.length) {
      const { error, count } = await context.supabase
        .from("products")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(withoutExt as any, { onConflict: "tenant_id,slug", ignoreDuplicates: true, count: "exact" });
      if (error) throw error;
      processed += count ?? 0;
    }

    return { total: records.length, processed };
  });
