import { z } from "zod";

export const productInputSchema = z.object({
  slug: z.string().min(1).regex(/^[\p{L}\p{N}-]+$/ui, "الرابط يجب أن يحوي أحرف وأرقام و - فقط"),
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.number().min(0),
  old_price: z.number().min(0).nullable().optional(),
  currency: z.string().default("YER"),
  category_id: z.string().uuid().nullable().optional(),
  brand: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  model_url: z.string().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  badge: z.string().nullable().optional(),
  is_published: z.boolean().default(true),
  video_playback_id: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  compare_at_price: z.number().min(0).nullable().optional(),
  cost_price: z.number().min(0).nullable().optional(),
  model_3d_url: z.string().nullable().optional(),
  model_3d_thumbnail: z.string().nullable().optional(),
  model_3d_status: z.string().nullable().optional(),
  meta_sync_status: z.enum(["not_synced", "syncing", "synced", "failed"]).default("not_synced").nullable().optional(),
  // V3 CMS fields
  featured: z.boolean().default(false).optional(),
  is_deal: z.boolean().default(false).optional(),
  deal_start: z.string().nullable().optional(),
  deal_end: z.string().nullable().optional(),
});

export const productUpdateSchema = productInputSchema.partial().extend({
  id: z.string().uuid(),
});


export const categoryInputSchema = z.object({
  slug: z.string().min(1).regex(/^[\p{L}\p{N}-]+$/ui, "الرابط يجب أن يحوي أحرف وأرقام و - فقط"),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  sort: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryInputSchema.partial().extend({
  id: z.string().uuid(),
});

export const inventoryMovementSchema = z.object({
  product_id: z.string().uuid(),
  delta: z.number().int(),
  reason: z.enum(["restock", "sale", "adjustment", "return", "damage"]),
  reference: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementSchema>;
