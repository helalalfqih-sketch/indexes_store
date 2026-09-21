import { requireWhapiAdmin } from "./whapi-auth.server";
import {
  parseWhapiReadInput,
  readBoundedJson,
  readWhapi,
  verifyWhapiWebhook,
  WhapiError,
} from "./whapi.server";
import type { WhapiReadInput } from "./whapi.server";
import { getSupabaseAdmin } from "@/integrations/supabase/client.server";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  Vary: "Authorization",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS });
}

function failure(error: unknown): Response {
  return error instanceof WhapiError
    ? json({ ok: false, code: error.code }, error.status)
    : json({ ok: false, code: "WHAPI_REQUEST_FAILED" }, 503);
}

interface ReadDependencies {
  authorize: (request: Request) => Promise<string>;
  read: (input: WhapiReadInput) => Promise<unknown>;
}

export async function handleWhapiRead(
  request: Request,
  resource?: "health",
  dependencies: ReadDependencies = { authorize: requireWhapiAdmin, read: readWhapi },
): Promise<Response> {
  if (request.method !== "GET") return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
  try {
    await dependencies.authorize(request);
    const input = parseWhapiReadInput(new URL(request.url), resource);
    return json({ ok: true, resource: input.resource, data: await dependencies.read(input) });
  } catch (error) {
    return failure(error);
  }
}

export async function handleWhapiWebhook(request: Request): Promise<Response> {
  if (!verifyWhapiWebhook(request)) return json({ ok: false, code: "FORBIDDEN" }, 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get("content-type") || "")) {
    return json({ ok: false, code: "JSON_REQUIRED" }, 415);
  }
  try {
    const body = await readBoundedJson(
      new Response(request.body, { headers: request.headers }),
      256 * 1024,
    );
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new WhapiError("INVALID_EVENT", 400);
    const envelope = body as Record<string, unknown>;
    const rawMessages = Array.isArray(envelope.messages)
      ? envelope.messages
      : envelope.message && typeof envelope.message === "object"
        ? [envelope.message]
        : [];
    if (rawMessages.length === 0) return json({ ok: true, processed: 0 });

    const rows = rawMessages.flatMap((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const message = value as Record<string, unknown>;
      const id = typeof message.id === "string" ? message.id : null;
      const chatId =
        typeof message.chat_id === "string"
          ? message.chat_id
          : typeof message.chatId === "string"
            ? message.chatId
            : null;
      if (!id || !chatId) return [];
      const type = typeof message.type === "string" ? message.type : null;
      const media =
        message[type || ""] && typeof message[type || ""] === "object"
          ? (message[type || ""] as Record<string, unknown>)
          : {};
      const textObject =
        message.text && typeof message.text === "object"
          ? (message.text as Record<string, unknown>)
          : {};
      const text =
        typeof message.body === "string"
          ? message.body
          : typeof textObject.body === "string"
            ? textObject.body
            : typeof media.caption === "string"
              ? media.caption
              : null;
      const mediaId =
        typeof media.id === "string"
          ? media.id
          : typeof message.media_id === "string"
            ? message.media_id
            : null;
      const sender =
        typeof message.from === "string"
          ? message.from
          : typeof message.sender_id === "string"
            ? message.sender_id
            : null;
      const timestamp =
        typeof message.timestamp === "number" && Number.isFinite(message.timestamp)
          ? Math.trunc(message.timestamp)
          : null;
      return [
        {
          message_id: id,
          chat_id: chatId,
          sender_id: sender,
          message_type: type,
          text_content: text,
          media_id: mediaId,
          media_type: mediaId ? type : null,
          message_timestamp: timestamp,
          raw_metadata: { source: "whapi_webhook", has_media: Boolean(mediaId) },
        },
      ];
    });
    if (rows.length === 0) throw new WhapiError("INVALID_EVENT", 400);

    const { error } = await getSupabaseAdmin()
      .from("whatsapp_inbox" as never)
      .upsert(rows as never, { onConflict: "message_id", ignoreDuplicates: true });
    if (error) throw new WhapiError("WHAPI_INBOX_WRITE_FAILED", 503);
    return json({ ok: true, processed: rows.length });
  } catch (error) {
    return failure(error);
  }
}
