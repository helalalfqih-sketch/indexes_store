/**
 * Failure Analysis Engine — Phase 8 🛠️
 *
 * Parses build, typecheck, runtime, and database errors to extract root causes
 * and generate targeted recovery strategies for self-healing execution loops.
 */

export interface FailureAnalysisResult {
  problem: string;
  rootCause: string;
  affectedFiles: string[];
  suggestedFix: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  errorCategory: "typescript" | "build" | "runtime" | "database" | "unknown";
}

/**
 * Extract error context and line references from build / typecheck logs
 */
export function extractErrorContext(buildOutput: string): {
  errorMessages: string[];
  targetFiles: string[];
  errorCode?: string;
} {
  const errorMessages: string[] = [];
  const targetFiles: Set<string> = new Set();
  let errorCode: string | undefined;

  const lines = buildOutput.split("\n");
  for (const line of lines) {
    if (line.includes("error TS")) {
      const match = line.match(/(.*?\.(?:ts|tsx)):(\d+):(\d+)\s+-\s+error\s+(TS\d+):\s+(.*)/);
      if (match) {
        targetFiles.add(match[1].trim());
        errorCode = match[4];
        errorMessages.push(`[${match[4]}] ${match[5]}`);
      } else {
        errorMessages.push(line.trim());
      }
    } else if (line.includes("Error:") || line.includes("FAILED")) {
      errorMessages.push(line.trim());
    }
  }

  return {
    errorMessages,
    targetFiles: Array.from(targetFiles),
    errorCode,
  };
}

/**
 * Analyze an execution failure and generate recovery recommendations
 */
export function analyzeExecutionFailure(
  buildOutput: string,
  initialAffectedFiles: string[] = [],
): FailureAnalysisResult {
  const { errorMessages, targetFiles, errorCode } = extractErrorContext(buildOutput);
  const combinedFiles = Array.from(new Set([...initialAffectedFiles, ...targetFiles]));

  let problem = "فشل في فحص البناء البنائي المترجم (Typecheck/Build Error).";
  let rootCause = "تعارض في تعريف الأنواع أو استدعاء عناصر غير معرفة.";
  let suggestedFix = "إجراء تصحيح على استيرادات الأنواع والتحقق من المكونات المتأثرة.";
  let errorCategory: FailureAnalysisResult["errorCategory"] = "typescript";
  let riskLevel: FailureAnalysisResult["riskLevel"] = "medium";

  if (buildOutput.includes("Cannot find name") || errorCode === "TS2304") {
    problem = "رمز غير معرف (Cannot find name).";
    rootCause = "عدم استيراد النوع أو المكون المذكور من الملف المصدر.";
    suggestedFix = "إضافة الاستيراد المفقود من مكتبة الأنواع المعتمدة.";
    riskLevel = "low";
  } else if (buildOutput.includes("Property") && buildOutput.includes("does not exist")) {
    problem = "خاصية غير موجوة في نوع البيانات (Property does not exist).";
    rootCause = "استخدام اسم خاصية قديم أو غير مطابق للأنواع الرسمية.";
    suggestedFix =
      "تعديل المسمى ليتطابق مع الواجهة البرمجية المعرفة في store-data / Supabase Types.";
    riskLevel = "low";
  } else if (buildOutput.includes("supabase") || buildOutput.includes("migration")) {
    errorCategory = "database";
    problem = "خطأ في استعلام أو هجرة قاعدة البيانات Supabase DB.";
    rootCause = "عدم مطابقة أسماء الحقول للجداول أو سياسات RLS.";
    suggestedFix = "مراجعة ملفات Migrations وتصحيح حقول الاستعلام.";
    riskLevel = "high";
  }

  return {
    problem,
    rootCause,
    affectedFiles: combinedFiles,
    suggestedFix,
    riskLevel,
    errorCategory,
  };
}

/**
 * Generate Recovery Strategy plan for retry attempts
 */
export function generateRecoveryStrategy(analysis: FailureAnalysisResult, attempt: number): string {
  return `[Recovery Attempt #${attempt}]: المعالجة الموجهة لـ "${analysis.problem}" ⬅️ الحل الموصى به: ${analysis.suggestedFix}`;
}
