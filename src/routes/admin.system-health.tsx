import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Database,
  Lock,
  Server,
  Zap,
  RefreshCw,
  Sparkles,
  BarChart3,
  HardDrive,
  Check,
} from "lucide-react";
import { getAgentUsageStats, getAgentRole } from "@/lib/ai-agent.functions";

import {
  getLatestQualityReportFn,
  triggerQualityAuditFn,
  getQualityHistoryFn,
} from "@/lib/quality-api.server";

export const Route = createFileRoute("/admin/system-health")({
  head: () => ({
    meta: [
      { title: "حالة النظام ومقاييس الجودة — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemHealthDashboardPage,
});

function SystemHealthDashboardPage() {
  const getUsageFn = useServerFn(getAgentUsageStats);
  const getQualityReportServerFn = useServerFn(getLatestQualityReportFn);
  const triggerAuditServerFn = useServerFn(triggerQualityAuditFn);

  const {
    data: report,
    isLoading: loadingReport,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["quality-latest-report"],
    queryFn: () => getQualityReportServerFn(),
  });

  const { data: usage } = useQuery({
    queryKey: ["health-agent-usage"],
    queryFn: () => getUsageFn(),
  });

  const [isRunningAudit, setIsRunningAudit] = useState(false);

  const handleRunQualityAudit = async () => {
    setIsRunningAudit(true);
    try {
      await triggerAuditServerFn();
      await refetchReport();
    } catch {
      // Soft catch
    } finally {
      setIsRunningAudit(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
            <Activity className="h-7 w-7 text-emerald-500 animate-pulse" />
            مركز قياسات الجودة والتدقيق (Quality Control Center)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            لوحة حية تعرض نتائج محرك الجودة، أمان RLS، مقاييس البناء والـ TypeScript، والأدلة
            الموثقة آلياً.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunQualityAudit}
            disabled={isRunningAudit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunningAudit ? "animate-spin" : ""}`} />
            {isRunningAudit ? "جاري تشغيل محرك القياسات..." : "تشغيل التدقيق الآن (Run Audit)"}
          </button>
        </div>
      </div>

      {/* Main Score Banner */}
      <div className="rounded-3xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/40 text-center">
            <span className="text-3xl font-black text-foreground">
              {report?.overallScore ?? 100}
            </span>
            <span className="text-[10px] text-muted-foreground absolute -bottom-1 font-mono">
              / 100
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-foreground">درجة جودة المنصة الإجمالية</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Grade: {report?.grade ?? "A+"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              درجة موزونة آلياً تغطي الأمان (25%)، الأداء (20%)، الاختبارات (20%)، البناء (10%)،
              والـ TypeScript (10%).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs border-r border-zinc-800 pr-6">
          <div>
            <div className="text-muted-foreground font-bold">الناجح (Passed):</div>
            <div className="text-emerald-400 font-bold font-mono text-base">
              {report?.passedCount ?? 0} مدققات
            </div>
          </div>
          <div>
            <div className="text-muted-foreground font-bold">غير المقاس (Not Measured):</div>
            <div className="text-amber-400 font-bold font-mono text-base">
              {report?.notMeasuredCount ?? 0} مدققات
            </div>
          </div>
          <div>
            <div className="text-muted-foreground font-bold">النسخة (Schema):</div>
            <div className="text-cyan-400 font-bold font-mono text-base">
              {report?.schemaVersion ?? "1.0.0"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Auditor Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-400" /> نتائج وحدات التدقيق الموديلار
          (Registered Quality Auditors)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report?.results?.map((audit: any) => {
            const isPass = audit.status === "PASS";
            const isNotMeasured = audit.status === "NOT_MEASURED";

            return (
              <div
                key={audit.auditId}
                className={`rounded-2xl border p-4 space-y-3 shadow-sm transition ${
                  isPass
                    ? "bg-[#141418] border-zinc-800"
                    : isNotMeasured
                      ? "bg-[#181814] border-amber-500/30"
                      : "bg-[#1c1414] border-rose-500/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 line-clamp-1">{audit.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      isPass
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : isNotMeasured
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {audit.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">
                    المصدر: {audit.source}
                  </span>
                  <span className="font-mono font-bold text-violet-400">{audit.score}/100</span>
                </div>

                {isNotMeasured && audit.notMeasuredReason && (
                  <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[10px] text-amber-300">
                    <span className="font-bold">السبب: </span>
                    {audit.notMeasuredReason}
                  </div>
                )}

                {audit.evidence && audit.evidence.length > 0 && (
                  <div className="p-2 rounded-xl bg-black/40 border border-zinc-800/80 text-[10px] font-mono space-y-1 dir-ltr text-start">
                    <div className="text-zinc-500 font-bold dir-rtl">
                      الأدلة الموثقة (Evidence):
                    </div>
                    {audit.evidence.slice(0, 2).map((ev: any, idx: number) => (
                      <div key={idx} className="text-zinc-300 truncate">
                        {ev.key ? `${ev.key}: ${ev.value}` : String(ev.value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
