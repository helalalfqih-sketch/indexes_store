const WHAPI_PARTNER_BASE_URL = "https://manager.whapi.cloud";

export interface WhapiPartnerChannel {
  id: string;
  label: string;
  phone: string;
  token: string;
}

interface WhapiPartnerConfig {
  token: string;
  projectId: string;
}

function config(): WhapiPartnerConfig | null {
  const token = process.env.WHAPI_PARTNER_TOKEN?.trim();
  const projectId = process.env.WHAPI_PARTNER_PROJECT_ID?.trim();
  if (!token && !projectId) return null;
  if (!token || !projectId) throw new Error("WHAPI_PARTNER_CONFIG_INCOMPLETE");
  return { token, projectId };
}

export function isWhapiPartnerConfigured(): boolean {
  return Boolean(config());
}

async function partnerFetch(path: string, init: RequestInit = {}) {
  const cfg = config();
  if (!cfg) throw new Error("WHAPI_PARTNER_NOT_CONFIGURED");

  const response = await fetch(`${WHAPI_PARTNER_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`WHAPI_PARTNER_${response.status}`);
  }
  return response;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseChannel(value: unknown): WhapiPartnerChannel | null {
  const row = asRecord(value);
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const token = typeof row.token === "string" ? row.token.trim() : "";
  if (!id || !token) return null;

  return {
    id,
    label: typeof row.name === "string" && row.name.trim() ? row.name.trim() : `WhatsApp ${id}`,
    phone: typeof row.phone === "string" ? row.phone.replace(/\D/g, "") : "",
    token,
  };
}

function parseSingleChannel(payload: unknown): WhapiPartnerChannel | null {
  const root = asRecord(payload);
  for (const candidate of [root, root.channel, root.data, root.result]) {
    const parsed = parseChannel(candidate);
    if (parsed) return parsed;
  }
  return null;
}

export function parseWhapiPartnerChannels(payload: unknown): WhapiPartnerChannel[] {
  const root = asRecord(payload);
  const data = asRecord(root.data);
  const arrays = [
    Array.isArray(payload) ? payload : null,
    Array.isArray(root.channels) ? root.channels : null,
    Array.isArray(root.results) ? root.results : null,
    Array.isArray(root.data) ? root.data : null,
    Array.isArray(data.channels) ? data.channels : null,
  ];
  const rows = arrays.find((value): value is unknown[] => Array.isArray(value)) ?? [];
  return rows
    .map((row) => parseChannel(row))
    .filter((row): row is WhapiPartnerChannel => Boolean(row));
}

export async function listWhapiPartnerChannels(): Promise<WhapiPartnerChannel[]> {
  const cfg = config();
  if (!cfg) return [];
  const response = await partnerFetch(`/channels/list/${encodeURIComponent(cfg.projectId)}`);
  return parseWhapiPartnerChannels(await response.json());
}

export async function getWhapiPartnerChannel(
  channelId: string,
): Promise<WhapiPartnerChannel | null> {
  if (!config()) return null;
  const response = await partnerFetch(`/channels/${encodeURIComponent(channelId)}`);
  return parseSingleChannel(await response.json());
}

export async function createWhapiPartnerChannel(input: {
  label: string;
  phone?: string;
}): Promise<WhapiPartnerChannel> {
  const cfg = config();
  if (!cfg) throw new Error("WHAPI_PARTNER_NOT_CONFIGURED");

  const response = await partnerFetch("/channels", {
    method: "PUT",
    body: JSON.stringify({
      name: input.label,
      projectId: cfg.projectId,
      ...(input.phone ? { phone: input.phone } : {}),
    }),
  });
  const channel = parseSingleChannel(await response.json());
  if (!channel) throw new Error("WHAPI_PARTNER_CREATE_INVALID_RESPONSE");
  return channel;
}
