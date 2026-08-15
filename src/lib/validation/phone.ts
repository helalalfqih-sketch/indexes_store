import { z } from "zod";

/** Normalize both Arabic-Indic (٠–٩) and Extended-Arabic-Indic (۰–۹) digits to ASCII */
export function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

export const yemeniPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeArabicDigits)
  .transform((value) => value.replace(/[\s()+-]/g, ""))
  // Strip leading 00967 or 967 prefix
  .transform((value) => value.replace(/^(?:00967|967)/, ""))
  // Strip leading 0 from 0771234567 -> 771234567
  .transform((value) => value.replace(/^0(?=7\d{8}$)/, ""))
  .refine((value) => /^7\d{8}$/.test(value), "أدخل رقم جوال يمني صحيح مكون من 9 أرقام (مثل 771234567)")
  .transform((value) => `967${value}`);
