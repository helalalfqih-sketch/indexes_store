import { z } from "zod";

/**
 * Store domain validators (Tenant = Electronic Store).
 * Every write to tenant_store_profiles / tenant_store_settings is validated
 * here before reaching the service layer.
 */

const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().url("رابط غير صالح").max(500).optional(),
);

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const storeProfileSchema = z.object({
  display_name: z.string().trim().min(2, "اسم المتجر قصير جداً").max(120),
  slug: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{2,60}$/, "المعرّف: أحرف إنجليزية صغيرة وأرقام و- فقط")
      .optional(),
  ),
  logo_url: optionalUrl,
  banner_url: optionalUrl,
  description: optionalText(2000),
  business_type: optionalText(60),
  phone: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().regex(/^\+?[0-9]{7,15}$/, "رقم هاتف غير صالح").optional(),
  ),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().email("بريد غير صالح").max(200).optional(),
  ),
  social_links: z.record(z.string().max(500)).default({}),
  branding: z.record(z.unknown()).default({}),
});
export type StoreProfileInput = z.infer<typeof storeProfileSchema>;

/** Allowed setting keys — payment/shipping/contact/working hours/policies/visibility. */
export const STORE_SETTING_KEYS = [
  "payment",
  "shipping",
  "contact",
  "working_hours",
  "policies",
  "visibility",
] as const;

export const storeSettingKeySchema = z.enum(STORE_SETTING_KEYS);
export type StoreSettingKey = z.infer<typeof storeSettingKeySchema>;

/**
 * Setting values are structured JSON objects. SECURITY: never store secrets
 * (API tokens, private keys) in these settings — they are member-readable.
 */
export const storeSettingValueSchema = z.record(z.unknown());

export const upsertStoreSettingSchema = z.object({
  key: storeSettingKeySchema,
  value: storeSettingValueSchema,
});
