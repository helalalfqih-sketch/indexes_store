import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listRuntimeIncidents } from "@/lib/runtime-incidents.functions";
import { IncidentRecord, IncidentStats, IncidentSeverity } from "../types/incident.types";
import { IncidentDetailDrawer } from "./incident-detail-drawer";
import { ShieldAlert, AlertTriangle, Activity, RefreshCw, Filter, Eye, Cpu, CheckCircle2 } from "lucide-react";

export function ProductionIncidentCenterTab() {
  const listIncidentsFn = useServerFn(listRuntimeIncidents);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [stats, setStats] = useState<IncidentStats>({
    openCount: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lastSyncTime: new Date().toISOString(),
    ingestionStatus: "IDLE",
  });
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await listIncidentsFn();
      setIncidents(res.incidents || []);
      setStats(res.stats);
    } catch (err) {
      console.error("[ProductionIncidentCenter] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter((i) => {
    if (severityFilter === "ALL") return true;
    return i.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Summary Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border p-4 bg-card flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-muted-foreground font-bold">الحوادث المفتوحة Open</span>
            <div className="text-2xl font-black text-foreground mt-1">{stats.openCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-red-500/20 p-4 bg-red-500/5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-red-500 font-bold">حوادث حرجة Critical</span>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.criticalCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/20 text-red-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 p-4 bg-amber-500/5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-amber-500 font-bold">خطورة عالية High</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.highCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-muted-foreground font-bold">حالة البث Live Ingestion</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.ingestionStatus}</span>
            </div>
          </div>
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-accent transition"
            title="إعادة تحديث"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Filters & Controls Bar ── */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">التصفية حسب الخطورة:</span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                severityFilter === sev
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {sev === "ALL" ? "الكل" : sev}
            </button>
          ))}
        </div>
      </div>

      {/* ── Incident Cards Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <span className="animate-spin h-8 w-8 rounded-full border-3 border-primary border-t-transparent" />
          <span className="text-xs font-bold text-muted-foreground">جاري تحميل حوادث الإنتاج...</span>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-3xl bg-card/50 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h3 className="font-bold text-base">لا توجد حوادث تشغيل مسجلة</h3>
          <p className="text-xs text-muted-foreground max-w-md">
            جميع الخدمات تعمل بشكل مستقر ولم تسجل أي أعطال أو استجابات غير متوقعة فورية.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-2xl border border-border p-4 bg-card hover:border-primary/40 transition shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        incident.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-500"
                          : incident.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-blue-500/20 text-blue-500"
                      }`}
                    >
                      {incident.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono text-muted-foreground">
                      {incident.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    تكرار ×{incident.occurrence_count}
                  </span>
                </div>

                <h3 className="font-bold text-sm leading-snug line-clamp-2">{incident.title}</h3>

                <p className="text-xs font-mono text-muted-foreground line-clamp-2 dir-ltr">
                  {incident.route || "/"} • {incident.normalized_message}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                <span className="text-[10px] text-muted-foreground font-mono">
                  آخر ظهور: {new Date(incident.last_seen_at).toLocaleTimeString("ar-SA")}
                </span>
                <button
                  onClick={() => setSelectedIncident(incident)}
                  className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Eye className="h-3.5 w-3.5" />
                  عرض الأدلة
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedIncident && (
        <IncidentDetailDrawer
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}
