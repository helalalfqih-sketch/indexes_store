import { supabase } from "@/integrations/supabase/client";
import { IncidentIngestionPayload, IncidentRecord } from "@/features/runtime-incidents/types/incident.types";
import { sanitizeEvidence } from "./evidence-sanitizer.service";
import { generateIncidentFingerprint, classifySeverity } from "./incident-fingerprinting";

export async function processIngestedIncident(
  payload: IncidentIngestionPayload,
  client: any = supabase
): Promise<{ incident: IncidentRecord; isNew: boolean }> {
  const db = client as any;
  const tenantId = payload.tenantId || null;
  const env = payload.environment || "production";
  const fingerprint = generateIncidentFingerprint(payload);
  const severity = classifySeverity(payload.statusCode, payload.message);
  const sanitized = sanitizeEvidence(payload.evidence || {});

  // 1. Check if an incident already exists with this fingerprint
  const { data: existing } = await db
    .from("runtime_incidents")
    .select("*")
    .eq("environment", env)
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  let incidentRecord: IncidentRecord;
  let isNew = false;

  if (existing) {
    // Deduplicate & increment occurrence count
    const { data: updated } = await db
      .from("runtime_incidents")
      .update({
        occurrence_count: existing.occurrence_count + 1,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: existing.status === "RESOLVED" ? "REGRESSED" : existing.status,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    incidentRecord = updated || existing;
  } else {
    // Create new incident
    isNew = true;
    const title = payload.operation
      ? `${payload.operation}: ${payload.message.slice(0, 60)}`
      : payload.message.slice(0, 80);

    const { data: created, error } = await db
      .from("runtime_incidents")
      .insert({
        tenant_id: tenantId,
        fingerprint,
        title,
        severity,
        status: "DETECTED",
        source: payload.source || "APPLICATION",
        environment: env,
        route: payload.route || null,
        operation: payload.operation || null,
        normalized_message: payload.message,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        occurrence_count: 1,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[processIngestedIncident] Error inserting incident:", error);
      throw error;
    }
    incidentRecord = created;
  }

  // 2. Insert Occurrence Record
  await db.from("runtime_incident_occurrences").insert({
    incident_id: incidentRecord.id,
    tenant_id: tenantId,
    trace_id: payload.traceId || null,
    request_id: payload.requestId || null,
    deployment_id: payload.deploymentId || null,
    method: payload.method || null,
    request_path: payload.route || null,
    status_code: payload.statusCode || null,
    message: payload.message,
    sanitized_evidence: sanitized,
    occurred_at: new Date().toISOString(),
  });

  return { incident: incidentRecord, isNew };
}
