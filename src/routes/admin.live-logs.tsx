import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, Fragment } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Terminal,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldAlert,
  Database,
  Github,
  Monitor,
  Store,
  Server,
  Wrench,
  CheckCircle2,
  Eye,
  X,
  Sparkles,
  Zap,
  ExternalLink,
  Globe,
  TriangleAlert,
  Clock,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  Code2,
} from "lucide-react";
import {
  listLiveLogsFn,
  updateLiveLogStatusFn,
  clearLiveLogsFn,
  SystemLiveLogEntry,
  ErrorTypeCategory,
  ErrorLevel,
  ErrorStatus,
} from "@/services/live-logs.service";
import { reportLiveError } from "@/lib/live-error-capturer";
import { createAdaptivePollingInterval } from "@/lib/query-polling";

const LIVE_LOGS_POLLING_INTERVAL = createAdaptivePollingInterval(10_000, 60_000);

export const Route = createFileRoute("/admin/live-logs")({
  head: () => ({
    meta: [
      { title: "سجلات الأخطاء المباشرة (Vercel Live Console) — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLiveLogsPage,
});

function AdminLiveLogsPage() {
  const listLogsServerFn = useServerFn(listLiveLogsFn);
  const updateStatusServerFn = useServerFn(updateLiveLogStatusFn);
  const clearLogsServerFn = useServerFn(clearLiveLogsFn);
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = useState("");
  const [errorType, setErrorType] = useState<string>("ALL");
  const [level, setLevel] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Expanded log rows & copy state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<SystemLiveLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Query logs with polling support
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["system-live-logs", search, errorType, level, statusFilter],
    queryFn: () =>
      listLogsServerFn({
        data: {
          search,
          errorType,
          level,
          status: statusFilter,
          limit: 150,
        },
      }),
    staleTime: 10_000,
    refetchInterval: autoRefresh ? LIVE_LOGS_POLLING_INTERVAL : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const logs = data?.logs || [];
  const stats = data?.stats || {
    total: 0,
    open: 0,
    fatal: 0,
    adminUi: 0,
    storefrontUi: 0,
    supabaseDb: 0,
    githubIntegration: 0,
    serverFunction: 0,
  };

  // Filter logs by method and HTTP status code dynamically
  const filteredLogs = logs.filter((log) => {
    if (methodFilter !== "ALL") {
      const method = log.context?.method || (log.stackTrace?.includes("POST") ? "POST" : "GET");
      if (method !== methodFilter) return false;
    }

    if (statusCodeFilter !== "ALL") {
      const code = String(
        log.context?.status ||
          (log.errorName.includes("403")
            ? "403"
            : log.errorName.includes("404")
              ? "404"
              : log.errorName.includes("503")
                ? "503"
                : "200"),
      );
      if (statusCodeFilter === "ERROR" && !["403", "404", "500", "503"].includes(code))
        return false;
      if (statusCodeFilter !== "ERROR" && code !== statusCodeFilter) return false;
    }

    return true;
  });

  const warnCount = logs.filter(
    (l) => l.level === "warn" || l.errorName.includes("403") || l.errorName.includes("404"),
  ).length;
  const errorCount = logs.filter(
    (l) => l.level === "error" || l.errorName.includes("500") || l.errorName.includes("503"),
  ).length;
  const fatalCount = logs.filter((l) => l.level === "fatal").length;

  const handleUpdateStatus = async (id: string, newStatus: ErrorStatus) => {
    try {
      await updateStatusServerFn({ data: { id, status: newStatus } });
      await queryClient.invalidateQueries({ queryKey: ["system-live-logs"] });
      if (selectedLog && selectedLog.id === id) {
        setSelectedLog((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearLogs = async (mode: "resolved_only" | "all") => {
    if (mode === "all" && !confirm("هل أنت تأكد من تفريغ كافة سجلات الأخطاء؟")) return;
    setIsClearing(true);
    try {
      await clearLogsServerFn({ data: { clearMode: mode } });
      await queryClient.invalidateQueries({ queryKey: ["system-live-logs"] });
      if (selectedLog) setSelectedLog(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleTriggerTestError = () => {
    const errorTypesList: ErrorTypeCategory[] = [
      "Admin UI",
      "Storefront UI",
      "Supabase DB",
      "GitHub Integration",
      "Server Function",
    ];
    const randomType = errorTypesList[Math.floor(Math.random() * errorTypesList.length)];

    if (randomType === "Supabase DB") {
      reportLiveError({
        errorName: "SupabaseRLSError [42501]",
        errorType: "Supabase DB",
        level: "error",
        location: "supabase/migrations/products_table",
        cause: "new row violates row-level security policy for table 'products'",
        stackTrace:
          "PostgrestError: permission denied for table products at fetch (src/lib/order.functions.ts:45)",
        context: {
          method: "POST",
          status: 403,
          host: "indexes-store.vercel.app",
          action: "INSERT",
        },
      });
    } else if (randomType === "GitHub Integration") {
      reportLiveError({
        errorName: "GitHubApiError [403]",
        errorType: "GitHub Integration",
        level: "error",
        location: "src/services/github-sync.ts",
        cause: "API rate limit exceeded for user ID 849204. Token scope expired.",
        stackTrace:
          "HttpError: API rate limit exceeded at Octokit.request (node_modules/@octokit/request/dist-src/fetch-wrapper.js:80)",
        context: {
          method: "GET",
          status: 403,
          host: "indexes-store.vercel.app",
          endpoint: "GET /user/repos",
        },
      });
    } else if (randomType === "Storefront UI") {
      reportLiveError({
        errorName: "TypeError: Cannot read properties of undefined (reading 'price')",
        errorType: "Storefront UI",
        level: "error",
        location: "/store/products/checkout-modal",
        cause: "المكون حاول عرض السعر لمنتج غير مهيأ بعد",
        stackTrace:
          "TypeError: Cannot read properties of undefined (reading 'price')\n    at ProductPriceTag (src/components/ProductCard.tsx:32:15)",
        context: { method: "GET", status: 500, host: "indexes-store.vercel.app" },
      });
    } else {
      reportLiveError({
        errorName: "ServerFunctionExecutionError",
        errorType: "Server Function",
        level: "fatal",
        location: "src/routes/api/ai.agent.ts",
        cause: "HTTP 500: Server Timeout while invoking Vertex AI API provider",
        stackTrace: "Error: Socket hang up at ServerFnHandler (src/routes/api/ai.agent.ts:112:9)",
        context: {
          method: "POST",
          status: 503,
          host: "indexes-store.vercel.app",
          provider: "Google Vertex AI",
        },
      });
    }

    refetch();
  };

  const buildCopyableCodeBlock = (log: SystemLiveLogEntry) => {
    return `\`\`\`json
{
  "id": "${log.id}",
  "error_name": "${log.errorName}",
  "error_type": "${log.errorType}",
  "level": "${log.level}",
  "status": "${log.status}",
  "location": "${log.location}",
  "created_at": "${log.createdAt}",
  "cause": ${JSON.stringify(log.cause)},
  "suggested_fix": ${JSON.stringify(log.suggestedFix)},
  "stack_trace": ${JSON.stringify(log.stackTrace || "N/A")},
  "context": ${JSON.stringify(log.context || {}, null, 2)}
}
\`\`\``;
  };

  const copyToClipboard = (text: string, logId?: string) => {
    navigator.clipboard.writeText(text);
    if (logId) {
      setCopiedId(logId);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedBlock(true);
      setTimeout(() => setCopiedBlock(false), 2000);
    }
  };

  const formatVercelTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const monthStr = d.toLocaleDateString("en-US", { month: "short" });
      const dayStr = String(d.getDate()).padStart(2, "0");
      const timeStr =
        d.toTimeString().split(" ")[0] +
        "." +
        String(d.getMilliseconds()).padStart(2, "0").slice(0, 2);
      return `${monthStr} ${dayStr} ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (log: SystemLiveLogEntry) => {
    const statusCode = Number(
      log.context?.status ||
        (log.errorName.includes("403")
          ? 403
          : log.errorName.includes("404")
            ? 404
            : log.errorName.includes("503")
              ? 503
              : log.level === "fatal"
                ? 500
                : 200),
    );

    if (statusCode === 200) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          200
        </span>
      );
    } else if (statusCode === 403) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          403
        </span>
      );
    } else if (statusCode === 404) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
          404
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
          {statusCode}
        </span>
      );
    }
  };

  const getMethodBadge = (log: SystemLiveLogEntry) => {
    const method = String(
      log.context?.method || (log.stackTrace?.includes("POST") ? "POST" : "GET"),
    ).toUpperCase();
    if (method === "POST") {
      return <span className="text-[11px] font-mono font-black text-emerald-400">POST</span>;
    } else if (method === "PUT" || method === "PATCH") {
      return <span className="text-[11px] font-mono font-black text-purple-400">{method}</span>;
    } else if (method === "DELETE") {
      return <span className="text-[11px] font-mono font-black text-rose-400">DELETE</span>;
    }
    return <span className="text-[11px] font-mono font-black text-sky-400">GET</span>;
  };

  return (
    <div
      className="space-y-5 bg-[#000000] text-zinc-100 p-4 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl font-sans"
      dir="rtl"
    >
      {/* Top Header - Vercel Console Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M12 1L24 22H0L12 1Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2 font-mono">
                indexes-store <span className="text-zinc-500">/</span> logs
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Vercel Live Console — تتبع كافـة سجلات النشر والسيرفر والـ API المباشرة
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition border font-mono ${
              autoRefresh
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`}
            />
            {autoRefresh ? "Live Mode ●" : "Live Mode (Paused)"}
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800 transition border border-zinc-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin text-emerald-400" : ""}`}
            />
            تحديث
          </button>

          <button
            type="button"
            onClick={handleTriggerTestError}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-xs"
          >
            <Zap className="h-3.5 w-3.5" />
            محاكاة خطأ تجريبي
          </button>

          <button
            type="button"
            onClick={() => handleClearLogs("resolved_only")}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            تفريغ
          </button>

          <a
            href="https://vercel.com/helalalfqih-2473s-projects/indexes-store/logs?panelState=opened&live=true"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-black text-black hover:bg-zinc-200 transition shadow-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Vercel Dashboard
          </a>
        </div>
      </div>

      {/* Vercel Console Counters & Timeline Controls */}
      <div className="rounded-2xl border border-zinc-800 bg-[#0a0a0c] p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        {/* Timeline & Level badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 font-mono">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            <span>Timeline:</span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-mono">
              Last 30 minutes
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Warning counter */}
          <button
            type="button"
            onClick={() => setLevel(level === "warn" ? "ALL" : "warn")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
              level === "warn"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <span className="text-amber-400">Warning</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px]">
              {warnCount}
            </span>
          </button>

          {/* Error counter */}
          <button
            type="button"
            onClick={() => setLevel(level === "error" ? "ALL" : "error")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
              level === "error"
                ? "bg-red-500/20 text-red-300 border-red-500/40"
                : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <span className="text-red-400">Error</span>
            <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px]">
              {errorCount}
            </span>
          </button>

          {/* Fatal counter */}
          <button
            type="button"
            onClick={() => setLevel(level === "fatal" ? "ALL" : "fatal")}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition ${
              level === "fatal"
                ? "bg-rose-600/30 text-rose-300 border-rose-500/50"
                : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <span className="text-rose-400">Fatal</span>
            <span className="px-1.5 py-0.5 rounded-md bg-rose-600/20 text-rose-300 text-[10px]">
              {fatalCount}
            </span>
          </button>
        </div>

        {/* Filter Pills: Method & Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-700"
          >
            <option value="ALL">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          {/* Status Code Filter */}
          <select
            value={statusCodeFilter}
            onChange={(e) => setStatusCodeFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-700"
          >
            <option value="ALL">All Status Codes</option>
            <option value="ERROR">Errors (4xx / 5xx)</option>
            <option value="403">403 Forbidden</option>
            <option value="404">404 Not Found</option>
            <option value="503">503 Service Unavailable</option>
            <option value="200">200 OK</option>
          </select>

          {/* Type Filter */}
          <select
            value={errorType}
            onChange={(e) => setErrorType(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-zinc-700"
          >
            <option value="ALL">All Categories</option>
            <option value="Server Function">Server Function</option>
            <option value="Supabase DB">Supabase DB</option>
            <option value="Storefront UI">Storefront UI</option>
            <option value="Admin UI">Admin UI</option>
            <option value="GitHub Integration">GitHub API</option>
          </select>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute right-3.5 top-3 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search logs... (e.g. image-proxy, 403, WhatsApp, /_serverFn)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-zinc-800 bg-[#0a0a0c] pr-10 pl-4 py-2.5 text-xs font-mono font-medium text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute left-3 top-2.5 text-zinc-500 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Vercel Real-Time Live Logs Table */}
      <div className="rounded-2xl border border-zinc-800 bg-[#090b10] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-[#0d0f17] text-zinc-400 text-[11px] font-mono">
                <th className="py-3 px-4 text-right">Time</th>
                <th className="py-3 px-3 text-center">Method</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Host</th>
                <th className="py-3 px-4 text-right">Request / Path</th>
                <th className="py-3 px-4 text-right">Message & Details</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Connecting to Vercel live stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center font-mono">
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <span className="text-emerald-400 text-2xl">✓</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-300">
                          لا توجد أخطاء مسجَّلة حالياً
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          النظام نشط وجاهز — ستظهر الأخطاء الحقيقية هنا فور حدوثها تلقائياً
                        </p>
                        <p className="text-[10px] text-zinc-700 mt-0.5 font-mono">
                          Listening: /api/public/image-proxy · /api/webhooks/whatsapp ·
                          /api/ai/agent · Admin UI · Storefront UI
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const hostName = log.context?.host || "indexes-store.vercel.app";

                  return (
                    <Fragment key={log.id}>
                      <tr
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className={`group cursor-pointer transition hover:bg-zinc-900/70 ${
                          isExpanded ? "bg-zinc-900/90 border-l-2 border-emerald-400" : ""
                        }`}
                      >
                        {/* Time */}
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-400 text-[11px] font-mono dir-ltr text-right">
                          {formatVercelTime(log.createdAt)}
                        </td>

                        {/* Method */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getMethodBadge(log)}
                        </td>

                        {/* Status Code */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {getStatusBadge(log)}
                        </td>

                        {/* Host */}
                        <td className="py-3 px-4 whitespace-nowrap text-zinc-400 text-[11px] font-mono dir-ltr text-right">
                          {hostName}
                        </td>

                        {/* Request Path */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-emerald-300 font-semibold dir-ltr text-right max-w-[200px] truncate">
                          {log.location}
                        </td>

                        {/* Message */}
                        <td className="py-3 px-4 text-zinc-200 font-mono text-[11px] max-w-[340px] truncate dir-ltr text-right">
                          <span
                            className={
                              log.level === "warn"
                                ? "text-amber-300"
                                : log.level === "error" || log.level === "fatal"
                                  ? "text-rose-300 font-bold"
                                  : "text-zinc-300"
                            }
                          >
                            {log.cause}
                          </span>
                        </td>

                        {/* Expand Button */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLogId(isExpanded ? null : log.id);
                            }}
                            className="p-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Code & Suggested Fix Row */}
                      {isExpanded && (
                        <tr className="bg-[#05070a] border-b border-zinc-800">
                          <td colSpan={7} className="p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
                                <Code2 className="h-4 w-4 text-emerald-400" />
                                <span>Payload & Stack Details for Log ID: {log.id}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(buildCopyableCodeBlock(log), log.id)
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-mono font-bold text-white hover:bg-zinc-700 transition"
                                >
                                  {copiedId === log.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" /> Copy Code Block
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateStatus(
                                      log.id,
                                      log.status === "resolved" ? "open" : "resolved",
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                                    log.status === "resolved"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {log.status === "resolved" ? "Resolved" : "Mark as Resolved"}
                                </button>
                              </div>
                            </div>

                            {/* Suggested Fix Box */}
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs font-sans text-emerald-200">
                              <div className="font-bold flex items-center gap-1.5 text-emerald-400 mb-1">
                                <Wrench className="h-4 w-4 text-emerald-400" />
                                <span>اقتراح إصلاح الخطأ المقترح (Automated Fix Suggestion):</span>
                              </div>
                              <p className="leading-relaxed">{log.suggestedFix}</p>
                            </div>

                            {/* Code Block Box */}
                            <div className="rounded-xl border border-zinc-800 bg-[#020305] p-3 overflow-x-auto font-mono text-[11px] text-zinc-300 dir-ltr">
                              <pre className="whitespace-pre-wrap">
                                {buildCopyableCodeBlock(log)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
