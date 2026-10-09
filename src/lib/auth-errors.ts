import { z } from "zod";
import {
  isSupabaseServiceRestriction,
  SUPABASE_UNAVAILABLE_MESSAGE_AR,
} from "@/integrations/supabase/resilience";

/** Map auth provider errors to safe, useful Arabic messages. */
export function mapAuthError(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message ?? "بيانات غير صالحة";
  if (isSupabaseServiceRestriction(err)) return SUPABASE_UNAVAILABLE_MESSAGE_AR;

  const message = err instanceof Error ? err.message : String(err);
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "بيانات الدخول غير صحيحة — تحقق من البريد وكلمة المرور.";
  }
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "هذا البريد مسجَّل مسبقاً — جرّب تسجيل الدخول.";
  }
  if (normalized.includes("email not confirmed")) {
    return "بريدك غير مؤكَّد بعد — افتح رسالة التأكيد في صندوق بريدك.";
  }
  if (normalized.includes("password should be")) {
    return "كلمة المرور ضعيفة — 8 أحرف على الأقل مع حرف ورقم.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة.";
  }
  if (
    normalized.includes("access_denied") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled")
  ) {
    return "تم إلغاء تسجيل الدخول.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "تعذّر الاتصال بالخادم — تحقق من الإنترنت.";
  }

  return "تعذّر إكمال العملية. حاول مرة أخرى بعد قليل.";
}
