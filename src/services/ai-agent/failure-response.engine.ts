/**
 * Failure Response Engine — Smart Communication Layer 💬🛠️
 *
 * Converts technical exceptions, compilation failures, RLS errors, and sandbox blocks
 * into clear, structured, actionable failure explanations for the store owner.
 */

import type { TaskStatus } from "./agent.tasks";

export interface FailureResponseDetails {
  errorType: TaskStatus;
  reason: string;
  affectedFiles: string[];
  affectedSystem: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  suggestedFix: string;
  requiredAction: string;
  errorLog?: string;
}

/**
 * Parses raw errors, stack traces, and build logs to generate structured failure explanation
 */
export function analyzeAndFormatFailure(
  rawError: any,
  context: { affectedFiles?: string[]; taskId?: string } = {},
): FailureResponseDetails {
  const errorMsg = String(rawError?.message || rawError || "");
  const affectedFiles = context.affectedFiles || [];

  // Default values
  let errorType: TaskStatus = "build_error";
  let reason = "فشل في معالجة واختبار الكود البرمجي.";
  let affectedSystem = "Engine Build & Verification Pipeline";
  let riskLevel: FailureResponseDetails["riskLevel"] = "medium";
  let suggestedFix = "مراجعة استيرادات الكود وتطابق الأنواع المعرفة في المشروع.";
  let requiredAction = "الموافقة على إعادة المحاولة أو تعديل الملفات المتأثرة.";

  // 1. Permission Denied / Protected Paths
  if (
    errorMsg.includes("Permission denied") ||
    errorMsg.includes("EACCES") ||
    errorMsg.includes("protected path")
  ) {
    errorType = "permission_error";
    reason = "محاولة تعديل مسار محمي أو صلاحيات ملفات غير كافية.";
    affectedSystem = "Security & Permission Guard";
    riskLevel = "high";
    suggestedFix = "منح صلاحيات الكتابة للمسار أو استثناء الملف المحمي.";
    requiredAction = "إذن مالك المنظومة (Owner Action Required).";
  }
  // 2. Sandbox Blocked
  else if (errorMsg.includes("blocked") || errorMsg.includes("Sandbox")) {
    errorType = "blocked";
    reason = "تم حظر العملية بواسطة نظام الحماية المباشر (Sandbox Guard).";
    affectedSystem = "Execution Sandbox";
    riskLevel = "critical";
    suggestedFix = "مراجعة نطاق التعديل والتأكد من عدم كسر ملفات النظام الحساسة.";
    requiredAction = "اعتماد التغيير من المالك بشكل مستثنى.";
  }
  // 3. Database & RLS Errors
  else if (
    errorMsg.includes("RLS") ||
    errorMsg.includes("row-level security") ||
    errorMsg.includes("Supabase") ||
    errorMsg.includes("PostgREST")
  ) {
    errorType = "database_error";
    reason = "فشل في استعلام قاعدة البيانات أو انتهاك سياسة RLS Security.";
    affectedSystem = "Database & Supabase RLS";
    riskLevel = "high";
    suggestedFix = "مراجعة سياسات RLS وقواعد الوصول الخاصة بالمتجر (tenant_id).";
    requiredAction = "تحديث ملفات الهجرة Migration لتضمين سياسة الوصول.";
  }
  // 4. Missing Environment Variables
  else if (
    errorMsg.includes("ENV") ||
    errorMsg.includes("API_KEY") ||
    errorMsg.includes("missing key")
  ) {
    errorType = "validation_error";
    reason = "فقدان مفاتيح الاتصال أو متغيرات البيئة الأساسية (Env Variables).";
    affectedSystem = "Environment Configuration";
    riskLevel = "medium";
    suggestedFix = "تكوين المفاتيح المطلوبة في ملف .env أو إعدادات لوحة التحكم.";
    requiredAction = "إضافة المتغيرات المفقودة في لوحة التحكم.";
  }
  // 5. TypeScript / Compilation Errors
  else if (
    errorMsg.includes("TS") ||
    errorMsg.includes("Typecheck") ||
    errorMsg.includes("Cannot find name")
  ) {
    errorType = "build_error";
    reason = "تعارض في تعريف الأنواع (TypeScript Compiler Error).";
    affectedSystem = "Frontend & Server Function Types";
    riskLevel = "medium";
    suggestedFix = "إضافة الاستيراد المفقود أو ضبط أنواع البيانات البرمجية.";
    requiredAction = "السماح بالترقيع التلقائي لملفات الأنواع.";
  }

  const rawLog = errorMsg.slice(0, 1000);
  if (rawLog.trim().length > 0) {
    suggestedFix = `${suggestedFix}\n\n📋 نص وتفاصيل السجل البرمجي للخطأ:\n${rawLog}`;
  }

  return {
    errorType,
    reason,
    affectedFiles,
    affectedSystem,
    riskLevel,
    suggestedFix,
    requiredAction,
    errorLog: rawLog,
  };
}
