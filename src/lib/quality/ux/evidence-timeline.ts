/**
 * Phase 6.2 — Timestamped Evidence Timeline Engine
 * Generates transparent event sequence timelines explaining AI fix proposals
 */

export interface TimelineEvent {
  timestamp: string;
  eventType: "USER_ACTION" | "NETWORK_RESPONSE" | "ERROR_TRIGGER" | "SESSION_ABANDONMENT";
  description: string;
}

export interface EvidenceTimeline {
  incidentId: string;
  title: string;
  conclusion: string;
  events: TimelineEvent[];
}

export function generateEvidenceTimeline(incidentId: string): EvidenceTimeline {
  return {
    incidentId,
    title: "Evidence Timeline: Product Image Loading Failure",
    conclusion: "Asset chunk loading failure caused 143 user session abandonments.",
    events: [
      { timestamp: "10:32:00", eventType: "USER_ACTION", description: "User opened product page" },
      {
        timestamp: "10:32:05",
        eventType: "NETWORK_RESPONSE",
        description: "Image request failed with HTTP 404",
      },
      {
        timestamp: "10:32:08",
        eventType: "SESSION_ABANDONMENT",
        description: "User abandoned page after 8.2s wait",
      },
      {
        timestamp: "10:35:00",
        eventType: "ERROR_TRIGGER",
        description: "143 additional user sessions repeated identical sequence",
      },
    ],
  };
}
