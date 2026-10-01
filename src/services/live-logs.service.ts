import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ErrorTypeCategory =
  | "Admin UI"
  | "Storefront UI"
  | "Supabase DB"
  | "GitHub Integration"
  | "Server Function"
  | "Network/API"
  | "System";

export type ErrorLevel = "error" | "warn" | "fatal" | "info";
export type ErrorStatus = "open" | "investigating" | "resolved";

export interface SystemLiveLogEntry {
  id: string;
  tenantId?: string | null;
  errorName: string;
  errorType: ErrorTypeCategory | string;
  level: ErrorLevel;
  location: string;
  cause: string;
  suggestedFix: string;
  stackTrace?: string | null;
  context?: Record<string, any>;
  status: ErrorStatus;
  createdAt: string;
}

export interface LiveLogsStats {
  total: number;
  open: number;
  fatal: number;
  adminUi: number;
  storefrontUi: number;
  supabaseDb: number;
  githubIntegration: number;
  serverFunction: number;
}

/**
 * Smart suggested fix engine based on error patterns, location, and stack traces.
 */
export function generateSuggestedFix(
  errorName: string,
  cause: string,
  location: string,
  stackTrace?: string | null,
  errorType?: string
): string {
  const lowerName = (errorName || "").toLowerCase();
  const lowerCause = (cause || "").toLowerCase();
  const lowerStack = (stackTrace || "").toLowerCase();
  const lowerLoc = (location || "").toLowerCase();
  const typeStr = (errorType || "").toLowerCase();

  // 1. Supabase RLS / Permission Errors
  if (
    lowerCause.includes("row-level security") ||
    lowerCause.includes("rls") ||
    lowerCause.includes("permission denied") ||
    typeStr.includes("supabase")
  ) {
    return "💡 اقتراح الإصلاح: تحقق من سياسات RLS (Row Level Security) في Supabase للجدول المستهدف، وتأكد من منح صلاحيات الوصول للمستخدم أو الاستعانة بـ Service Role لعمليات الخادم الحساسة.";
  }

  // 2. Authentication & JWT Expired
  if (
    lowerCause.includes("jwt") ||
    lowerCause.includes("unauthorized") ||
    lowerCause.includes("auth") ||
    lowerCause.includes("token expired")
  ) {
    return "💡 اقتراح الإصلاح: الجلسة انتهت أو أن رمز JWT غير صالح. قم بعمل تحديث للجلسة (Refresh Session) أو اطلب من المستخدم إعادات تسجيل الدخول.";
  }

  // 3. GitHub API Integration Errors
  if (
    typeStr.includes("github") ||
    lowerLoc.includes("github") ||
    lowerCause.includes("github") ||
    lowerCause.includes("rate limit") ||
    lowerCause.includes("bad credentials")
  ) {
    return "💡 اقتراح الإصلاح: تحقق من صحة رمز GitHub Personal Access Token (PAT) في المتغيرات البيئية وتأكد من منح صلاحيات repo/workflow، أو انتظر تجديد حد الطلبات (Rate Limit).";
  }

  // 4. Network / Failed to Fetch / CORS
  if (
    lowerCause.includes("failed to fetch") ||
    lowerCause.includes("networkerror") ||
    lowerCause.includes("cors") ||
    lowerName.includes("typeerror: failed to fetch")
  ) {
    return "💡 اقتراح الإصلاح: تعذر الاتصال بـ API أو السيرفر. تحقق من اتصال الشبكة، أو إعدادات CORS على النطاق المستهدف، وتأكد من أن السيرفر الخلفي متصل ومشتغل.";
  }

  // 5. Null Pointer / React Rendering Error
  if (
    lowerCause.includes("cannot read properties of undefined") ||
    lowerCause.includes("cannot read properties of null") ||
    lowerCause.includes("is not a function") ||
    typeStr.includes("ui")
  ) {
    return "💡 اقتراح الإصلاح: افحص متغيرات الحالة (State) الممررة للمكون المذكور واكتشف الحقول غير المهيأة. استخدم التمرير الآمن (Optional Chaining `?.`) وقيم fallback افترضية.";
  }

  // 6. Database Foreign Key / Unique Constraint
  if (lowerCause.includes("violates foreign key") || lowerCause.includes("duplicate key")) {
    return "💡 اقتراح الإصلاح: تعارض قيود قاعدة البيانات. تحقق من وجود السجل الأب (Foreign Key) أو منع تكرار قيمة الحقل الفريد قبل الإدخال.";
  }

  // 7. Route / 404 / Missing API Endpoint
  if (lowerCause.includes("404") || lowerCause.includes("not found")) {
    return "💡 اقتراح الإصلاح: المسار المطلوب غير دقيق أو غير موجود. تحقق من مطابقة اسم المسار في ملفات TanStack Router أو موجهات الـ Server API.";
  }

  // Default Fallback
  return "💡 اقتراح الإصلاح: راجع سطر الـ Stack Trace المحدد في الكود أدناه لتحديد دالة الاستدعاء وتدقيق معلمات الإدخال الممرضة.";
}

// In-memory ring buffer — stores ONLY real captured errors (max 200)
// This starts empty; real errors are pushed via logLiveErrorFn()
const inMemoryLiveLogs: SystemLiveLogEntry[] = [];

// Sensitive runtime logs are server-only. Never fall back to an anonymous client.
async function getDbClient() {
  const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
  return getSupabaseAdmin();
}

async function requirePlatformAdmin(context: any) {
  const db = context?.supabase;
  const userId = context?.userId;
  if (!db || !userId) throw new Error("Unauthenticated");

  const { data, error } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !data) throw new Error("Forbidden: platform admin required");
}

/**
 * Server-side helper: log a real error from any Server Function or API route.
 * Fire-and-forget — never throws so it won't break the caller.
 */
export async function logServerError(opts: {
  errorName: string;
  errorType?: string;
  level?: ErrorLevel;
  location: string;
  cause: string;
  stackTrace?: string;
  context?: Record<string, any>;
}): Promise<void> {
  const fix = generateSuggestedFix(
    opts.errorName,
    opts.cause,
    opts.location,
    opts.stackTrace,
    opts.errorType || "Server Function"
  );
  const entry: SystemLiveLogEntry = {
    id: crypto.randomUUID(),
    tenantId: null,
    errorName: opts.errorName,
    errorType: opts.errorType || "Server Function",
    level: opts.level || "error",
    location: opts.location,
    cause: opts.cause,
    suggestedFix: fix,
    stackTrace: opts.stackTrace || null,
    context: opts.context || {},
    status: "open",
    createdAt: new Date().toISOString(),
  };
  inMemoryLiveLogs.unshift(entry);
  if (inMemoryLiveLogs.length > 200) inMemoryLiveLogs.pop();

  // Persist to DB using admin client (bypasses RLS across all serverless instances)
  try {
    const db = await getDbClient();
    await (db as any).from("system_live_logs").insert({
      id: entry.id,
      error_name: entry.errorName,
      error_type: entry.errorType,
      level: entry.level,
      location: entry.location,
      cause: entry.cause,
      suggested_fix: fix,
      stack_trace: entry.stackTrace || null,
      context: entry.context || {},
      tenant_id: null,
      status: "open",
      created_at: entry.createdAt,
    });
  } catch (err) {
    console.warn("Log DB insert notice:", err);
  }
}

/**
 * Server-side helper: wrap a Supabase query and auto-log any real DB error.
 */
export async function captureSupabaseQueryError<T>(
  promise: Promise<{ data: T | null; error: any }>,
  location: string
): Promise<{ data: T | null; error: any }> {
  const result = await promise;
  if (result.error) {
    const err = result.error;
    await logServerError({
      errorName: err.code ? `SupabaseError [${err.code}]` : "SupabaseDBError",
      errorType: "Supabase DB",
      level: "error",
      location,
      cause: err.message || err.details || "فشل تنفيذ الاستعلام في سوبا بيس",
      stackTrace: `Code: ${err.code || "N/A"}\nMessage: ${err.message || ""}\nDetails: ${err.details || ""}\nHint: ${err.hint || ""}`,
      context: { status: 500, host: "indexes-store.vercel.app", code: err.code, details: err.details },
    }).catch(() => {});
  }
  return result;
}

/**
 * Server Fn: List system live logs with filtering and analytics.
 */
export const listLiveLogsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      search: z.string().optional(),
      errorType: z.string().optional(),
      level: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().optional().default(100),
    })
  )
  .handler(
    async ({ data, context }): Promise<{ logs: SystemLiveLogEntry[]; stats: LiveLogsStats }> => {
      await requirePlatformAdmin(context);
      let dbLogs: SystemLiveLogEntry[] = [];

      try {
        const db = await getDbClient();
        let query = (db as any)
          .from("system_live_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(data.limit || 100);

        const { data: dbData, error } = await query;

        if (!error && dbData && dbData.length > 0) {
          dbLogs = dbData.map((row: any) => ({
            id: row.id,
            tenantId: row.tenant_id,
            errorName: row.error_name,
            errorType: row.error_type,
            level: row.level,
            location: row.location,
            cause: row.cause,
            suggestedFix:
              row.suggested_fix ||
              generateSuggestedFix(row.error_name, row.cause, row.location, row.stack_trace, row.error_type),
            stackTrace: row.stack_trace,
            context: row.context,
            status: row.status,
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase system_live_logs table query skipped, using fallback logs:", err);
      }

      // Merge DB logs with in-memory logs (deduplicated by id)
      const existingIds = new Set(dbLogs.map((l) => l.id));
      const combinedLogs = [...dbLogs];

      for (const memLog of inMemoryLiveLogs) {
        if (!existingIds.has(memLog.id)) {
          combinedLogs.push(memLog);
        }
      }

      // Sort by created_at DESC
      combinedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply filtering
      let filteredLogs = combinedLogs;

      if (data.errorType && data.errorType !== "ALL") {
        filteredLogs = filteredLogs.filter((l) => l.errorType === data.errorType);
      }

      if (data.level && data.level !== "ALL") {
        filteredLogs = filteredLogs.filter((l) => l.level === data.level);
      }

      if (data.status && data.status !== "ALL") {
        filteredLogs = filteredLogs.filter((l) => l.status === data.status);
      }

      if (data.search && data.search.trim()) {
        const s = data.search.trim().toLowerCase();
        filteredLogs = filteredLogs.filter(
          (l) =>
            l.errorName.toLowerCase().includes(s) ||
            l.cause.toLowerCase().includes(s) ||
            l.location.toLowerCase().includes(s) ||
            l.suggestedFix.toLowerCase().includes(s)
        );
      }

      const stats: LiveLogsStats = {
        total: filteredLogs.length,
        open: filteredLogs.filter((l) => l.status === "open").length,
        fatal: filteredLogs.filter((l) => l.level === "fatal").length,
        adminUi: filteredLogs.filter((l) => l.errorType === "Admin UI").length,
        storefrontUi: filteredLogs.filter((l) => l.errorType === "Storefront UI").length,
        supabaseDb: filteredLogs.filter((l) => l.errorType === "Supabase DB").length,
        githubIntegration: filteredLogs.filter((l) => l.errorType === "GitHub Integration").length,
        serverFunction: filteredLogs.filter((l) => l.errorType === "Server Function").length,
      };

      return { logs: filteredLogs, stats };
    }
  );

/**
 * Server Fn: Record a new error into system_live_logs.
 */
export const logLiveErrorFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      errorName: z.string().min(1),
      errorType: z.string().default("System"),
      level: z.enum(["error", "warn", "fatal", "info"]).default("error"),
      location: z.string().min(1),
      cause: z.string().min(1),
      suggestedFix: z.string().optional(),
      stackTrace: z.string().optional(),
      context: z.record(z.any()).optional(),
      tenantId: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const fix =
      data.suggestedFix ||
      generateSuggestedFix(data.errorName, data.cause, data.location, data.stackTrace, data.errorType);

    const generatedId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const memEntry: SystemLiveLogEntry = {
      id: generatedId,
      tenantId: null,
      errorName: data.errorName,
      errorType: data.errorType,
      level: data.level,
      location: data.location,
      cause: data.cause,
      suggestedFix: fix,
      stackTrace: data.stackTrace || null,
      context: data.context || {},
      status: "open",
      createdAt: nowIso,
    };

    // Always push to in-memory store for instant visibility
    inMemoryLiveLogs.unshift(memEntry);
    if (inMemoryLiveLogs.length > 200) inMemoryLiveLogs.pop();

    // Try saving to Supabase DB table
    try {
      const db = await getDbClient();
      const payload = {
        id: generatedId,
        error_name: data.errorName,
        error_type: data.errorType,
        level: data.level,
        location: data.location,
        cause: data.cause,
        suggested_fix: fix,
        stack_trace: data.stackTrace || null,
        context: data.context || {},
        tenant_id: null,
        status: "open",
        created_at: nowIso,
      };

      await (db as any).from("system_live_logs").insert(payload);
    } catch (err) {
      console.warn("Database persistence for live log notice:", err);
    }

    return { success: true, log: memEntry };
  });

/**
 * Server Fn: Update status of a live log (e.g. resolve or investigate).
 */
export const updateLiveLogStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string(),
      status: z.enum(["open", "investigating", "resolved"]),
    })
  )
  .handler(async ({ data, context }) => {
    await requirePlatformAdmin(context);
    // Update in-memory log
    const memLog = inMemoryLiveLogs.find((l) => l.id === data.id);
    if (memLog) {
      memLog.status = data.status;
    }

    // Try updating Supabase DB
    try {
      const db = await getDbClient();
      await (db as any)
        .from("system_live_logs")
        .update({ status: data.status })
        .eq("id", data.id);
    } catch (err) {
      console.warn("Database status update notice:", err);
    }

    return { success: true };
  });

/**
 * Server Fn: Clear resolved logs or clear all logs.
 */
export const clearLiveLogsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      clearMode: z.enum(["resolved_only", "all"]),
    })
  )
  .handler(async ({ data, context }) => {
    await requirePlatformAdmin(context);
    if (data.clearMode === "resolved_only") {
      for (let i = inMemoryLiveLogs.length - 1; i >= 0; i--) {
        if (inMemoryLiveLogs[i].status === "resolved") {
          inMemoryLiveLogs.splice(i, 1);
        }
      }
    } else {
      inMemoryLiveLogs.length = 0;
    }

    try {
      const db = await getDbClient();
      let query = (db as any).from("system_live_logs").delete();
      if (data.clearMode === "resolved_only") {
        query = query.eq("status", "resolved");
      } else {
        query = query.neq("id", "00000000-0000-0000-0000-000000000000");
      }
      await query;
    } catch (err) {
      console.warn("Database delete logs notice:", err);
    }

    return { success: true };
  });
