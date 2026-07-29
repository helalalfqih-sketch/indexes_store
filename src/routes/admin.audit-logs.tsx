import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, UserCheck, HardDrive, CheckCircle } from "lucide-react";
import { getAuditLogsFn, UserAuditLogEntry } from "@/services/audit.service";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({
    meta: [
      { title: "سجل العمليات والامتثال — لوحة الإدارة" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  const getAuditLogsServerFn = useServerFn(getAuditLogsFn);

  const { data: logs = [] } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => getAuditLogsServerFn(),
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Shield className="h-7 w-7 text-emerald-500" />
          سجل الأمان وتتبع عمليات المستخدمين (Audit & Compliance Log)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          تسجيل توثيقي شامل لعمليات المدراء والتغييرات البرمجة وإصلاحات الذكاء الاصطناعي مع عنوان
          الـ IP والنتيجة.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="space-y-3">
          {logs.map((log: UserAuditLogEntry) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-background border border-border/80 flex items-center justify-between text-xs font-mono"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400" />
                  <span className="font-bold text-foreground">{log.userEmail}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-violet-500/20 text-violet-300 font-mono">
                    {log.action}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  المورد: {log.targetResource} | IP: {log.ipAddress}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-400 font-bold">{log.result}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
