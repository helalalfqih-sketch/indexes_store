const WHAPI_BASE = "https://gate.whapi.cloud";

function getWhapiToken() {
  const token = process.env.WHAPI_TOKEN;
  if (!token) throw new Error("WHAPI_TOKEN is not configured");
  return token;
}

export async function whapiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${getWhapiToken()}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${WHAPI_BASE}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`Whapi request failed (${response.status})`);
  return response.json();
}

export function verifyWhapiWebhook(request: Request) {
  const secret = process.env.WHAPI_WEBHOOK_SECRET;
  if (!secret) return false;
  const supplied =
    request.headers.get("x-whapi-secret") ||
    request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return supplied === secret;
}
