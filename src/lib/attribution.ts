/** Marketing attribution helpers for Meta Ads -> Product -> WhatsApp funnel */

export type AttributionData = {
  source?: string;
  medium?: string;
  campaign?: string;
  adset?: string;
  creative?: string;
  capturedAt?: string;
};

const STORAGE_KEY = "indexes_attribution";

export function captureAttribution(url = window.location.href): AttributionData {
  if (typeof window === "undefined") return {};

  const params = new URL(url).searchParams;
  const data: AttributionData = {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    adset: params.get("utm_adset") || undefined,
    creative: params.get("utm_content") || undefined,
    capturedAt: new Date().toISOString(),
  };

  if (Object.values(data).some(Boolean)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return data;
}

export function getStoredAttribution(): AttributionData {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}
