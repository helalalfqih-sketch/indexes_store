import { z } from "zod";

export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

export const RESERVED_SLUGS = new Set([
  "www", "app", "admin", "api", "auth", "assets", "static", "cdn",
  "default", "public", "root", "system", "support", "help", "docs",
  "mail", "billing", "checkout", "cart", "login", "signup", "signin",
  "dashboard", "onboarding", "settings", "account", "platform",
]);

export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(80, "الاسم طويل جداً"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "المعرّف قصير جداً")
    .max(32, "المعرّف طويل جداً")
    .regex(SLUG_REGEX, "استخدم أحرفاً لاتينية صغيرة وأرقاماً وشرطات فقط")
    .refine((s) => !RESERVED_SLUGS.has(s), "هذا المعرّف محجوز"),
  plan: z.enum(["free", "pro", "enterprise"]).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const slugCheckSchema = z.object({
  slug: z.string().trim().toLowerCase().min(3).max(32).regex(SLUG_REGEX),
});
