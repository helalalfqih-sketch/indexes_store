# [PR 1] NOQTA Production Incident Intelligence Center

## 📌 Pull Request Overview

**PR Title**: `[PR 1] Add NOQTA Production Incident Intelligence Center in /admin/ai-developer`  
**Branch**: `feat/ai-developer-runtime-incident-center` -> `main`

---

## 🚀 Key Features Delivered in PR 1

1. **Database Schema & Migrations**:
   - Created SQL migration [`supabase/migrations/20260729180000_runtime_incident_center.sql`](file:///d:/web/indexes_store/supabase/migrations/20260729180000_runtime_incident_center.sql) defining the 8 core tables (`runtime_incidents`, `runtime_incident_occurrences`, `runtime_incident_events`, `runtime_incident_analyses`, `runtime_incident_plans`, `runtime_incident_links`, `runtime_ingestion_cursors`, `runtime_trace_spans`) with RLS policies, status/severity CHECK constraints, and unique fingerprint indices.

2. **Core Domain Services**:
   - **Evidence Sanitizer** ([`src/services/runtime-incidents/evidence-sanitizer.service.ts`](file:///d:/web/indexes_store/src/services/runtime-incidents/evidence-sanitizer.service.ts)): Redacts Bearer tokens, JWTs, authorization headers, cookies, API keys, and customer PII.
   - **Incident Fingerprinting** ([`src/services/runtime-incidents/incident-fingerprinting.ts`](file:///d:/web/indexes_store/src/services/runtime-incidents/incident-fingerprinting.ts)): Generates stable SHA256 fingerprints from route, operation, status family, and normalized error message.
   - **Incident Ingestion Service** ([`src/services/runtime-incidents/incident-ingestion.service.ts`](file:///d:/web/indexes_store/src/services/runtime-incidents/incident-ingestion.service.ts)): Deduplicates occurrences into unified incidents and increments occurrence counts.

3. **Server Functions API**:
   - Created [`src/lib/runtime-incidents.functions.ts`](file:///d:/web/indexes_store/src/lib/runtime-incidents.functions.ts) with `listRuntimeIncidents`, `getIncidentDetails`, and `ingestRuntimeEvent`.

4. **UI Workspace in `/admin/ai-developer`**:
   - Replaced fake `getQualityIncidentsServerFn` with real `listRuntimeIncidents` query.
   - Replaced default build success state with `NOT_MEASURED` until an actual measurement occurs.
   - Added primary workspace tab: **Production Incident Center / مركز أعطال الإنتاج**.
   - Rendered summary stats bar (Open Incidents, Critical, High, Live Ingestion Status), severity filters, incident cards, and incident detail drawer with evidence timeline and flow correlation.

---

## 🧪 Verification Logs

```text
> typecheck
> tsc --noEmit
✓ Exit Code: 0 (0 errors)

> build
✓ Built Nitro server bundle in 11.10s (0 errors)
```

---

## ⚠️ Merge Requirements Checklist
- [x] PR 1 scope completed (Schema, Ingestion, Sanitization, Fingerprinting, UI Tab)
- [x] Typecheck & production build pass clean
- [ ] Do NOT auto-merge — wait for code review
- [ ] Do NOT execute production migrations directly
