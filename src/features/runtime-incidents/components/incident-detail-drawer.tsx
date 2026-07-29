import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getIncidentDetails } from "@/lib/runtime-incidents.server";
import { IncidentRecord, IncidentOccurrenceRecord } from "../types/incident.types";
import { AlertTriangle, Clock, Terminal, CheckCircle, ShieldAlert, ArrowLeftRight, X } from "lucide-react";

interface Props {
  incident: IncidentRecord;
  onClose: () => void;
}

export function IncidentDetailDrawer({ incident, onClose }: Props) {
  const getDetailsFn = useServerFn(getIncidentDetails);
  const [loading, setLoading] = useState(true);
  const [occurrences, setOccurrences] = useState<IncidentOccurrenceRecord[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getDetailsFn({ data: { incidentId: incident.id } })
      .then((res) => {
        if (active) {
          setOccurrences(res.occurrences || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [incident.id, getDetailsFn]);

  return (
    <div className="fixed inset-y-0 end-0 z-50 flex w-full max-w-2xl flex-col bg-card border-s border-border shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h2 className="font-bold text-base line-clamp-1">{incident.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Incident Summary Card */}
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border p-4 bg-background">
          <div>
            <span className="text-xs text-muted-foreground">الحالة Status</span>
            <div className="font-bold text-sm text-amber-500">{incident.status}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">الخطورة Severity</span>
            <div className="font-bold text-sm text-red-500">{incident.severity}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">عدد التكرارات Occurrences</span>
            <div className="font-bold text-sm">{incident.occurrence_count}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">آخر ظهور Last Seen</span>
            <div className="font-bold text-xs">{new Date(incident.last_seen_at).toLocaleTimeString("ar-SA")}</div>
          </div>
        </div>

        {/* Flow Correlation Mapping */}
        <div className="rounded-2xl border border-border p-4 bg-background space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
            تدفق الطلب والربط الـ Execution Flow
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-muted/40 p-3 rounded-xl dir-ltr">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold">
              {incident.route || "/"}
            </span>
            <span>→</span>
            <span className="bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-md font-bold">
              {incident.operation || "server_function"}
            </span>
            <span>→</span>
            <span className="bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded-md font-bold">
              {incident.source}
            </span>
          </div>
        </div>

        {/* Normalized Error Message */}
        <div className="rounded-2xl border border-border p-4 bg-background space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            نص الخطأ المنظم Normalized Error
          </h3>
          <pre className="text-xs font-mono bg-muted p-3 rounded-xl overflow-x-auto text-red-400 whitespace-pre-wrap dir-ltr">
            {incident.normalized_message}
          </pre>
        </div>

        {/* Evidence Occurrences Timeline */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            سجل الأدلة والتسلسل الزمني Evidence Timeline
          </h3>

          {loading ? (
            <div className="flex justify-center p-8">
              <span className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : occurrences.length === 0 ? (
            <div className="text-center p-4 text-xs text-muted-foreground">لا تتوفر أدلة مسجلة حتى الآن</div>
          ) : (
            <div className="space-y-2">
              {occurrences.map((occ) => (
                <div key={occ.id} className="rounded-xl border border-border/80 p-3 bg-background space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">{new Date(occ.occurred_at).toLocaleTimeString("ar-SA")}</span>
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px]">{occ.method || "GET"} {occ.status_code || 500}</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-muted/60 p-2 rounded-lg text-foreground overflow-x-auto whitespace-pre-wrap dir-ltr">
                    {JSON.stringify(occ.sanitized_evidence, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
