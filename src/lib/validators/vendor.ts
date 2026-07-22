import { z } from 'zod';

export const VendorRegisterSchema = z.object({
  name: z.string().min(2, 'اسم البائع يجب أن يكون حرفين على الأقل'),
  slug: z.string().min(2, 'الرابط المختصر مطلوب').regex(/^[a-z0-9-]+$/, 'الرابط المختصر يجب أن يحوي أحرفاً إنجليزية صغيرة وأرقاماً وشُرط فقط'),
  description: z.string().optional(),
  contact_email: z.string().email('البريد الإلكتروني غير صحيح'),
  contact_phone: z.string().min(8, 'رقم الهاتف يجب أن يكون 8 أرقام على الأقل'),
  business_type: z.enum(['individual', 'company', 'establishment']).default('individual'),
});

export type VendorRegisterInput = z.infer<typeof VendorRegisterSchema>;

export const VendorProfileSchema = z.object({
  business_type: z.enum(['individual', 'company', 'establishment']).default('individual'),
  commercial_register: z.string().optional(),
  tax_number: z.string().optional(),
  national_id: z.string().optional(),
  contact_email: z.string().email('البريد الإلكتروني غير صحيح'),
  contact_phone: z.string().min(8, 'رقم الهاتف غير صحيح'),
  bank_name: z.string().optional(),
  bank_account_name: z.string().optional(),
  bank_iban: z.string().optional(),
  wallet_number: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

export type VendorProfileInput = z.infer<typeof VendorProfileSchema>;

export const VendorSettingsSchema = z.object({
  auto_accept_orders: z.boolean().default(true),
  notify_email: z.boolean().default(true),
  notify_whatsapp: z.boolean().default(true),
  custom_shipping_fee: z.number().min(0).default(0),
  min_order_amount: z.number().min(0).default(0),
  processing_days: z.number().min(1).default(1),
});

export type VendorSettingsInput = z.infer<typeof VendorSettingsSchema>;

export const VendorCommissionSchema = z.object({
  commission_type: z.enum(['percentage', 'fixed']).default('percentage'),
  commission_rate: z.number().min(0).max(100).default(10),
  fixed_commission_amount: z.number().min(0).default(0),
});

export type VendorCommissionInput = z.infer<typeof VendorCommissionSchema>;
