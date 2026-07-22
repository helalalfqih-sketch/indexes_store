import { z } from "zod";

export const emailSchema = z.string().trim().email("بريد إلكتروني غير صالح").max(255);

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
  .max(72, "كلمة المرور طويلة جداً");

/** Strong password for NEW accounts: 8+ chars with at least one letter and one digit. */
export const strongPasswordSchema = passwordSchema
  .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل")
  .regex(/\d/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل");

/** Optional phone: digits with optional leading +, 7–15 digits. Empty string → undefined. */
export const optionalPhoneSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, "رقم هاتف غير صالح (أرقام فقط، 7–15 خانة)")
    .optional(),
);

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: strongPasswordSchema,
    confirm_password: z.string(),
    full_name: z.string().trim().min(2, "الاسم قصير جداً").max(120),
    phone: optionalPhoneSchema,
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
