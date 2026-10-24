import { z } from "zod";

export const productInputBase = z.object({
  slug: z
    .string()
    .min(1, "الرابط مطلوب")
    .regex(/^[\p{L}\p{N}-]+$/iu, "الرابط يجب أن يحوي أحرف وأرقام و - فقط"),
  name: z.string().min(1, "اسم المنتج مطلوب"),
  description: z.string().default(""),
  price: z.number({ message: "أدخل قيمة رقمية بالسعر" }).positive("يجب أن يكون السعر أكبر من صفر"),
  old_price: z.number().positive("السعر السابق يجب أن يكون أكبر من صفر").nullable().optional(),
  currency: z.string().default("YER"),
  category_id: z.string().uuid().nullable().optional(),
  brand: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  model_url: z.string().nullable().optional(),
  stock: z
    .number()
    .int("المخزون يجب أن يكون عددًا صحيحًا")
    .min(0, "المخزون لا يمكن أن يكون سالبًا")
    .default(0),
  tags: z.array(z.string()).default([]),
  badge: z.string().nullable().optional(),
  is_published: z.boolean().default(true),
  video_playback_id: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  compare_at_price: z
    .number()
    .positive("سعر المقارنة يجب أن يكون أكبر من صفر")
    .nullable()
    .optional(),
  cost_price: z.number().min(0, "تكلفة المنتج لا يمكن أن تكون سالبة").nullable().optional(),
  model_3d_url: z.string().nullable().optional(),
  model_3d_thumbnail: z.string().nullable().optional(),
  model_3d_status: z.string().nullable().optional(),
  meta_sync_status: z.enum(["not_synced", "syncing", "synced", "failed"]).nullable().optional(),
  // V3 CMS fields
  featured: z.boolean().optional(),
  is_deal: z.boolean().optional(),
  deal_start: z.string().nullable().optional(),
  deal_end: z.string().nullable().optional(),
});

export const productInputSchema = productInputBase.superRefine((data, ctx) => {
  if (data.compare_at_price != null && data.price != null && data.compare_at_price <= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["compare_at_price"],
      message: "سعر المقارنة يجب أن يكون أكبر من سعر البيع الحالي",
    });
  }

  if (data.old_price != null && data.price != null && data.old_price <= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["old_price"],
      message: "السعر السابق يجب أن يكون أكبر من سعر البيع الحالي",
    });
  }
});

export const productUpdateBase = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[\p{L}\p{N}-]+$/iu, "الرابط يجب أن يحوي أحرف وأرقام و - فقط")
    .optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive("يجب أن يكون السعر أكبر من صفر").optional(),
  old_price: z.number().positive("السعر السابق يجب أن يكون أكبر من صفر").nullable().optional(),
  currency: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  brand: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  model_url: z.string().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  badge: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  video_playback_id: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  compare_at_price: z
    .number()
    .positive("سعر المقارنة يجب أن يكون أكبر من صفر")
    .nullable()
    .optional(),
  cost_price: z.number().min(0).nullable().optional(),
  model_3d_url: z.string().nullable().optional(),
  model_3d_thumbnail: z.string().nullable().optional(),
  model_3d_status: z.string().nullable().optional(),
  meta_sync_status: z.enum(["not_synced", "syncing", "synced", "failed"]).nullable().optional(),
  featured: z.boolean().optional(),
  is_deal: z.boolean().optional(),
  deal_start: z.string().nullable().optional(),
  deal_end: z.string().nullable().optional(),
});

export const productUpdateSchema = productUpdateBase.superRefine((data, ctx) => {
  if (data.compare_at_price != null && data.price != null && data.compare_at_price <= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["compare_at_price"],
      message: "سعر المقارنة يجب أن يكون أكبر من سعر البيع الحالي",
    });
  }

  if (data.old_price != null && data.price != null && data.old_price <= data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["old_price"],
      message: "السعر السابق يجب أن يكون أكبر من سعر البيع الحالي",
    });
  }
});

const categoryInputBase = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[\p{L}\p{N}-]+$/iu, "الرابط يجب أن يحوي أحرف وأرقام و - فقط"),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  sort: z.number().int(),
  is_active: z.boolean(),
});

export const categoryInputSchema = categoryInputBase.extend({
  sort: categoryInputBase.shape.sort.default(0),
  is_active: categoryInputBase.shape.is_active.default(true),
});

export const categoryUpdateSchema = categoryInputBase.partial().extend({
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
