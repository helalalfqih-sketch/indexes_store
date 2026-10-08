import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
  errorType?: string,
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
const SERVER_LOG_DEDUPE_MS = 5 * 60_000;
const PUBLIC_REPORT_WINDOW_MS = 60_000;
const PUBLIC_REPORT_LIMIT = 5;
const PUBLIC_REPORT_MAX_KEYS = 2_000;
const recentServerLogs = new Map<string, number>();
const publicReportWindows = new Map<string, { startedAt: number; count: number }>();

function sanitizeLogText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[SECRET_KEY_REDACTED]")
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, "[PUB_KEY_REDACTED]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
    .replace(/(?:\+?967|0)?\s*[7137][0-9]{8}/g, "[PHONE_REDACTED]")
    .slice(0, maxLength);
}

function sanitizeLogContext(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const sanitized = Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 30)
      .map(([key, item]) => [
        sanitizeLogText(key, 80),
        typeof item === "string"
          ? sanitizeLogText(item, 500)
          : typeof item === "number" || typeof item === "boolean" || item == null
            ? item
            : sanitizeLogText(safeSerialize(item), 1_000),
      ]),
  );
  return JSON.stringify(sanitized).length <= 8_000 ? sanitized : {};
}

function safeSerialize(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    return (
      JSON.stringify(value, (_key, nestedValue) => {
        if (typeof nestedValue === "bigint") return nestedValue.toString();
        if (nestedValue && typeof nestedValue === "object") {
          if (seen.has(nestedValue)) return "[Circular]";
          seen.add(nestedValue);
        }
        return nestedValue;
      }) ?? String(value)
    );
  } catch {
    return "[Unserializable context]";
  }
}

function isDuplicateServerLog(signature: string): boolean {
  const currentTime = Date.now();
  const lastSeen = recentServerLogs.get(signature) ?? 0;
  if (currentTime - lastSeen < SERVER_LOG_DEDUPE_MS) return true;
  recentServerLogs.set(signature, currentTime);
  if (recentServerLogs.size > 500) {
    for (const [key, seenAt] of recentServerLogs) {
      if (currentTime - seenAt >= SERVER_LOG_DEDUPE_MS) recentServerLogs.delete(key);
    }
  }
  return false;
}

async function publicReportKey(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const headers = getRequest().headers;
    const clientAddress =
      headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clientAddress));
    return Array.from(new Uint8Array(digest).slice(0, 12), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  } catch {
    return "unknown";
  }
}

function allowPublicReport(key: string): boolean {
  const currentTime = Date.now();
  const window = publicReportWindows.get(key);
  if (!window || currentTime - window.startedAt >= PUBLIC_REPORT_WINDOW_MS) {
    if (!window && publicReportWindows.size >= PUBLIC_REPORT_MAX_KEYS) {
      for (const [existingKey, existingWindow] of publicReportWindows) {
        if (currentTime - existingWindow.startedAt >= PUBLIC_REPORT_WINDOW_MS) {
          publicReportWindows.delete(existingKey);
        }
      }
      while (publicReportWindows.size >= PUBLIC_REPORT_MAX_KEYS) {
        const oldestKey = publicReportWindows.keys().next().value;
        if (typeof oldestKey !== "string") break;
        publicReportWindows.delete(oldestKey);
      }
    }
    if (window) publicReportWindows.delete(key);
    publicReportWindows.set(key, { startedAt: currentTime, count: 1 });
    return true;
  }
  if (window.count >= PUBLIC_REPORT_LIMIT) return false;
  window.count += 1;
  return true;
}

const liveLogsAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

async function assertLiveLogsAdmin(context: any): Promise<void> {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Forbidden");
}

// Telemetry persistence is a privileged server operation. If the server key is
// unavailable, keep the bounded in-memory copy instead of attempting a public
// anonymous insert.
async function getDbClient() {
  try {
    const hasServiceKey =
      typeof process !== "undefined" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasServiceKey) return null;

    const { getSupabaseAdmin } = await import("@/integrations/supabase/client.server");
    return getSupabaseAdmin();
  } catch {
    return null;
  }
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
  const level = opts.level || "error";
  if (level === "info") return;

  const errorName = sanitizeLogText(opts.errorName, 160);
  const errorType = sanitizeLogText(opts.errorType || "Server Function", 80);
  const location = sanitizeLogText(opts.location, 500);
  const cause = sanitizeLogText(opts.cause, 2_000);
  const stackTrace = opts.stackTrace ? sanitizeLogText(opts.stackTrace, 8_000) : null;
  const signature = `${errorName}:${location}:${cause}`;
  if (isDuplicateServerLog(signature)) return;

  const fix = generateSuggestedFix(errorName, cause, location, stackTrace, errorType);
  const entry: SystemLiveLogEntry = {
    id: crypto.randomUUID(),
    tenantId: null,
    errorName,
    errorType,
    level,
    location,
    cause,
    suggestedFix: fix,
    stackTrace,
    context: sanitizeLogContext(opts.context),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  inMemoryLiveLogs.unshift(entry);
  if (inMemoryLiveLogs.length > 200) inMemoryLiveLogs.pop();

  // Persist to DB using admin client (bypasses RLS across all serverless instances)
  try {
    const db = await getDbClient();
    if (!db) return;
    const { error } = await (db as any).from("system_live_logs").insert({
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
    if (error && import.meta.env.DEV) console.warn("Live log persistence unavailable");
  } catch {
    if (import.meta.env.DEV) console.warn("Live log persistence unavailable");
  }
}

/**
 * Server-side helper: wrap a Supabase query and auto-log any real DB error.
 */
export async function captureSupabaseQueryError<T>(
  promise: Promise<{ data: T | null; error: any }>,
  location: string,
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
      context: {
        status: 500,
        host: "indexes-store.vercel.app",
        code: err.code,
        details: err.details,
      },
    }).catch(() => {});
  }
  return result;
}

/**
 * Server Fn: List system live logs with filtering and analytics.
 */
export const listLiveLogsFn = createServerFn({ method: "GET" })
  .middleware([liveLogsAuth, requireSupabaseAuth])
  .validator(
    z.object({
      search: z.string().max(200).optional(),
      errorType: z.string().max(80).optional(),
      level: z.string().max(20).optional(),
      status: z.string().max(20).optional(),
      limit: z.number().int().min(1).max(200).optional().default(100),
    }),
  )
  .handler(
    async ({ data, context }): Promise<{ logs: SystemLiveLogEntry[]; stats: LiveLogsStats }> => {
      await assertLiveLogsAdmin(context);
      let dbLogs: SystemLiveLogEntry[] = [];

      try {
        const db = context.supabase;
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
              generateSuggestedFix(
                row.error_name,
                row.cause,
                row.location,
                row.stack_trace,
                row.error_type,
              ),
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
      combinedLogs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

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
            l.suggestedFix.toLowerCase().includes(s),
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
    },
  );

/**
 * Server Fn: Record a new error into system_live_logs.
 */
export const logLiveErrorFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      errorName: z.string().min(1).max(160),
      errorType: z.string().max(80).default("System"),
      level: z.enum(["error", "warn", "fatal", "info"]).default("error"),
      location: z.string().min(1).max(500),
      cause: z.string().min(1).max(2_000),
      suggestedFix: z.string().max(2_000).optional(),
      stackTrace: z.string().max(8_000).optional(),
      context: z
        .record(z.any())
        .refine((value) => JSON.stringify(value).length <= 8_000, "Context is too large")
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (data.level === "info") return { success: true as const, ignored: true as const };

    const reportKey = await publicReportKey();
    if (!allowPublicReport(reportKey)) return { success: false as const, reason: "rate_limited" };

    const errorName = sanitizeLogText(data.errorName, 160);
    const errorType = sanitizeLogText(data.errorType, 80);
    const location = sanitizeLogText(data.location, 500);
    const cause = sanitizeLogText(data.cause, 2_000);
    const stackTrace = data.stackTrace ? sanitizeLogText(data.stackTrace, 8_000) : null;
    if (isDuplicateServerLog(`client:${errorName}:${location}:${cause}`)) {
      return { success: true as const, deduplicated: true as const };
    }

    const fix =
      (data.suggestedFix ? sanitizeLogText(data.suggestedFix, 2_000) : null) ||
      generateSuggestedFix(errorName, cause, location, stackTrace, errorType);

    const generatedId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const memEntry: SystemLiveLogEntry = {
      id: generatedId,
      tenantId: null,
      errorName,
      errorType,
      level: data.level,
      location,
      cause,
      suggestedFix: fix,
      stackTrace,
      context: sanitizeLogContext(data.context),
      status: "open",
      createdAt: nowIso,
    };

    // Always push to in-memory store for instant visibility
    inMemoryLiveLogs.unshift(memEntry);
    if (inMemoryLiveLogs.length > 200) inMemoryLiveLogs.pop();

    // Try saving to Supabase DB table
    try {
      const db = await getDbClient();
      if (!db) return { success: true as const, log: memEntry };
      const payload = {
        id: generatedId,
        error_name: errorName,
        error_type: errorType,
        level: data.level,
        location,
        cause,
        suggested_fix: fix,
        stack_trace: stackTrace,
        context: memEntry.context || {},
        tenant_id: null,
        status: "open",
        created_at: nowIso,
      };

      const { error } = await (db as any).from("system_live_logs").insert(payload);
      if (error && import.meta.env.DEV) console.warn("Live log persistence unavailable");
    } catch {
      if (import.meta.env.DEV) console.warn("Live log persistence unavailable");
    }

    return { success: true, log: memEntry };
  });

/**
 * Server Fn: Update status of a live log (e.g. resolve or investigate).
 */
export const updateLiveLogStatusFn = createServerFn({ method: "POST" })
  .middleware([liveLogsAuth, requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string(),
      status: z.enum(["open", "investigating", "resolved"]),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertLiveLogsAdmin(context);
    const db = await getDbClient();
    if (!db) throw new Error("Live log storage is unavailable");
    const { error } = await (db as any)
      .from("system_live_logs")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error("Unable to update the live log");

    const memLog = inMemoryLiveLogs.find((l) => l.id === data.id);
    if (memLog) memLog.status = data.status;

    return { success: true };
  });

/**
 * Server Fn: Clear resolved logs or clear all logs.
 */
export const clearLiveLogsFn = createServerFn({ method: "POST" })
  .middleware([liveLogsAuth, requireSupabaseAuth])
  .validator(
    z.object({
      clearMode: z.enum(["resolved_only", "all"]),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertLiveLogsAdmin(context);
    const db = await getDbClient();
    if (!db) throw new Error("Live log storage is unavailable");

    let query = (db as any).from("system_live_logs").delete();
    if (data.clearMode === "resolved_only") {
      query = query.eq("status", "resolved");
    } else {
      query = query.neq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { error } = await query;
    if (error) throw new Error("Unable to clear live logs");

    if (data.clearMode === "resolved_only") {
      for (let i = inMemoryLiveLogs.length - 1; i >= 0; i--) {
        if (inMemoryLiveLogs[i].status === "resolved") {
          inMemoryLiveLogs.splice(i, 1);
        }
      }
    } else {
      inMemoryLiveLogs.length = 0;
    }

    return { success: true };
  });
