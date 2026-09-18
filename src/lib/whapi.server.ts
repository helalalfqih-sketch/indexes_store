import { createHash, timingSafeEqual } from "node:crypto";

const WHAPI_BASE = "https://gate.whapi.cloud";
const MAX_RESPONSE_BYTES = 1024 * 1024;
export const WHAPI_CHANNEL_ID = "HAWKEY-KFHM7";
export const WHAPI_PHONE = "967771370740";

export class WhapiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "WhapiError";
    this.code = code;
    this.status = status;
  }
}

export type WhapiResource = "health" | "chats" | "messages" | "groups" | "channels" | "products";
export interface WhapiReadInput {
  resource: WhapiResource;
  count: number;
  offset: number;
  chatId?: string;
}

const READ_PATHS = {
  health: "/health",
  chats: "/chats",
  groups: "/groups",
  channels: "/newsletters",
  products: "/business/products",
} as const;

export function parseWhapiReadInput(url: URL, fixedResource?: "health"): WhapiReadInput {
  const params = url.searchParams;
  for (const key of params.keys()) {
    if (!["resource", "count", "offset", "chatId"].includes(key) || params.getAll(key).length !== 1) {
      throw new WhapiError("INVALID_QUERY", 400);
    }
  }
  const resource = fixedResource ?? params.get("resource");
  if (!resource || ![...Object.keys(READ_PATHS), "messages"].includes(resource)) {
    throw new WhapiError("INVALID_RESOURCE", 400);
  }
  const numberParam = (key: string, fallback: number, min: number, max: number) => {
    const value = params.get(key);
    if (value === null) return fallback;
    if (!/^\d+$/.test(value)) throw new WhapiError("INVALID_PAGINATION", 400);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
      throw new WhapiError("INVALID_PAGINATION", 400);
    }
    return parsed;
  };
  const chatId = params.get("chatId") ?? undefined;
  if (resource === "messages") {
    if (!chatId || !/^[a-zA-Z0-9_-]{1,128}@(s\.whatsapp\.net|g\.us|newsletter|lid|c\.us)$/.test(chatId)) {
      throw new WhapiError("INVALID_CHAT_ID", 400);
    }
  } else if (chatId !== undefined) {
    throw new WhapiError("UNEXPECTED_CHAT_ID", 400);
  }
  return {
    resource: resource as WhapiResource,
    count: numberParam("count", 20, 1, 50),
    offset: numberParam("offset", 0, 0, 10000),
    chatId,
  };
}

export function buildWhapiReadPath(input: WhapiReadInput): string {
  // Validate again at the server-client boundary; never expose an arbitrary URL proxy.
  const params = new URLSearchParams({ resource: input.resource, count: String(input.count), offset: String(input.offset) });
  if (input.chatId !== undefined) params.set("chatId", input.chatId);
  const checked = parseWhapiReadInput(new URL(`https://localhost/?${params}`));
  if (checked.resource === "health") return "/health";
  const path = checked.resource === "messages"
    ? `/messages/list/${encodeURIComponent(checked.chatId!)}`
    : READ_PATHS[checked.resource];
  return `${path}?count=${checked.count}&offset=${checked.offset}`;
}

export async function readBoundedJson(response: Response, maxBytes = MAX_RESPONSE_BYTES): Promise<unknown> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxBytes) throw new WhapiError("PAYLOAD_TOO_LARGE", 413);
  if (!response.body) throw new WhapiError("INVALID_JSON", 400);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new WhapiError("PAYLOAD_TOO_LARGE", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new WhapiError("INVALID_JSON", 400);
  }
}

export function verifyWhapiWebhook(request: Request, secret = process.env.WHAPI_WEBHOOK_SECRET): boolean {
  if (!secret || secret.length < 32) return false;
  const supplied = request.headers.get("x-whapi-secret") || request.headers.get("x-webhook-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!supplied || supplied.length > 4096) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(secret));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export interface WhapiRuntime {
  token?: string;
  fetcher?: typeof fetch;
}

export async function readWhapi(input: WhapiReadInput, runtime: WhapiRuntime = {}): Promise<unknown> {
  const path = buildWhapiReadPath(input);
  const token = runtime.token ?? process.env.WHAPI_TOKEN;
  if (!token || !token.trim()) throw new WhapiError("WHAPI_NOT_CONFIGURED", 503);
  const fetcher = runtime.fetcher ?? fetch;
  const get = async (apiPath: string): Promise<unknown> => {
    try {
      const response = await fetcher(`${WHAPI_BASE}${apiPath}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new WhapiError(response.status === 429 ? "WHAPI_RATE_LIMITED" : "WHAPI_UPSTREAM_ERROR", response.status === 429 ? 429 : 502);
      }
      return await readBoundedJson(response);
    } catch (error) {
      if (error instanceof WhapiError) throw error;
      throw new WhapiError("WHAPI_UNAVAILABLE", 502);
    }
  };
  const health = asRecord(await get("/health"));
  const user = asRecord(health.user);
  const status = asRecord(health.status);
  // This integration is deliberately restricted to the owner's one configured channel.
  if (health.channel_id !== WHAPI_CHANNEL_ID) throw new WhapiError("WHAPI_CHANNEL_MISMATCH", 409);
  const authorized = status.code === 4 && status.text === "AUTH";
  if (authorized && String(user.id) !== WHAPI_PHONE) throw new WhapiError("WHAPI_PHONE_MISMATCH", 409);
  if (input.resource === "health") {
    return { provider: "whapi", channelId: WHAPI_CHANNEL_ID, authorized, phone: authorized ? WHAPI_PHONE : null };
  }
  if (!authorized) throw new WhapiError("WHAPI_NOT_AUTHORIZED", 503);
  return get(path);
}
