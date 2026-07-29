import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveTenantId } from "@/lib/saas/tenant-context";
import { processIngestedIncident } from "@/services/runtime-incidents/incident-ingestion.service";
import { IncidentIngestionPayload, IncidentRecord, IncidentStats } from "@/features/runtime-incidents/types/incident.types";

/** Server Fn: List all production runtime incidents */
export const listRuntimeIncidents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ incidents: IncidentRecord[]; stats: IncidentStats }> => {
    try {
      const tenantId = await resolveTenantId(supabase);

      const { data, error } = await ((supabase as any).from("runtime_incidents"))
        .select("*")
        .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
        .order("last_seen_at", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("[listRuntimeIncidents] Query error:", error.message);
        return {
          incidents: [],
          stats: {
            openCount: 0,
            criticalCount: 0,
            highCount: 0,
            mediumCount: 0,
            lastSyncTime: new Date().toISOString(),
            ingestionStatus: "IDLE",
          },
        };
      }

      const incidents: IncidentRecord[] = data || [];
      const openIncidents = incidents.filter((i) => i.status !== "RESOLVED" && i.status !== "IGNORED");

      const stats: IncidentStats = {
        openCount: openIncidents.length,
        criticalCount: openIncidents.filter((i) => i.severity === "CRITICAL").length,
        highCount: openIncidents.filter((i) => i.severity === "HIGH").length,
        mediumCount: openIncidents.filter((i) => i.severity === "MEDIUM").length,
        lastSyncTime: new Date().toISOString(),
        ingestionStatus: "ACTIVE",
      };

      return { incidents, stats };
    } catch (err) {
      console.error("[listRuntimeIncidents] Unexpected error:", err);
      return {
        incidents: [],
        stats: {
          openCount: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lastSyncTime: new Date().toISOString(),
          ingestionStatus: "ERROR",
        },
      };
    }
  }
);

/** Server Fn: Get incident details with occurrence timeline */
export const getIncidentDetails = createServerFn({ method: "POST" })
  .validator((data: { incidentId: string }) => data)
  .handler(async ({ data: { incidentId } }) => {
    const { data: incident } = await ((supabase as any).from("runtime_incidents"))
      .select("*")
      .eq("id", incidentId)
      .maybeSingle();

    if (!incident) throw new Error("Incident not found");

    const { data: occurrences } = await ((supabase as any).from("runtime_incident_occurrences"))
      .select("*")
      .eq("incident_id", incidentId)
      .order("occurred_at", { ascending: false })
      .limit(50);

    return {
      incident: incident as IncidentRecord,
      occurrences: (occurrences || []) as any[],
    };
  });

/** Server Fn: Ingest a runtime event */
export const ingestRuntimeEvent = createServerFn({ method: "POST" })
  .validator((data: IncidentIngestionPayload) => data)
  .handler(async ({ data }) => {
    const tenantId = await resolveTenantId(supabase);
    return processIngestedIncident({ ...data, tenantId }, supabase);
  });
