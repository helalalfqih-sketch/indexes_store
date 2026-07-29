import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName, extractCategoryAndTagsFromCaption } from "@/lib/whatsapp.functions";
import { getDefaultTenantId } from "@/lib/saas/tenant-context";

const STORAGE_BUCKET = "product-images"; // Supabase Storage bucket

/** Get privileged DB client */
async function getAdminDb() {
  let db = supabase;
  if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (supabaseAdmin) db = supabaseAdmin;
    } catch {
      // fallback
    }
  }
  return db;
}

/**
 * Step 1: Get temporary CDN URL for a WhatsApp media object via Meta Graph API v25.0
 */
async function fetchMetaMediaUrl(mediaId: string, waToken: string): Promise<string | null> {
  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    if (!res.ok) {
      console.warn(`[WA] Meta Graph API error ${res.status} for mediaId=${mediaId}`);
      return null;
    }
    const json = await res.json();
    return json.url || null;
  } catch (err) {
    console.warn("[WA] fetchMetaMediaUrl failed:", err);
    return null;
  }
}

/**
 * Step 2: Download binary from Meta CDN (requires Bearer token)
 */
async function downloadBinary(
  metaUrl: string,
  waToken: string,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${waToken}` },
    });
    if (!res.ok) {
      console.warn(`[WA] Binary download failed: HTTP ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();
    console.log(`[WA] Downloaded ${buffer.byteLength} bytes (${contentType})`);
    return { buffer, contentType };
  } catch (err) {
    console.warn("[WA] downloadBinary failed:", err);
    return null;
  }
}

/**
 * Step 3: Upload binary to Supabase Storage → return permanent public URL
 */
async function uploadToStorage(
  db: any,
  storagePath: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<string | null> {
  const bucketsToTry = [STORAGE_BUCKET, "media", "uploads"];

  for (const bucketName of bucketsToTry) {
    try {
      console.log(`[WA Storage] Attempting upload to bucket="${bucketName}" path="${storagePath}"`);
      let { data, error } = await db.storage.from(bucketName).upload(storagePath, buffer, {
        contentType,
        upsert: true,
        cacheControl: "2592000", // 30 days
      });

      if (error && error.message?.toLowerCase().includes("not found")) {
        console.log(`[WA Storage] Bucket "${bucketName}" not found. Auto-creating bucket...`);
        await db.storage.createBucket(bucketName, { public: true });
        const retryRes = await db.storage.from(bucketName).upload(storagePath, buffer, {
          contentType,
          upsert: true,
          cacheControl: "2592000",
        });
        error = retryRes.error;
        data = retryRes.data;
      }

      if (error) {
        console.error(
          `[WA Storage] Failed bucket="${bucketName}": ${error.message} (status: ${(error as any)?.status || "unknown"})`,
        );
        continue;
      }

      const { data: urlData } = db.storage.from(bucketName).getPublicUrl(storagePath);
      const publicUrl = urlData?.publicUrl || null;
      console.log(
        `[WA Storage] ✅ Successfully uploaded to bucket="${bucketName}" -> ${publicUrl}`,
      );
      return publicUrl;
    } catch (err: any) {
      console.error(
        `[WA Storage] Exception uploading to bucket="${bucketName}":`,
        err?.message || err,
      );
    }
  }
  return null;
}

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      // ── GET: Meta Webhook Verification Handshake ─────────────────────────
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "indexes_wa_secret_verify_2026";

        if (mode === "subscribe" && token === expectedToken) {
          console.log("[WA Webhook] ✅ Handshake verified");
          return new Response(challenge || "OK", { status: 200 });
        }
        console.warn("[WA Webhook] ❌ Verification failed: token mismatch");
        return new Response("Forbidden", { status: 403 });
      },

      // ── POST: Full Media Sync Pipeline ───────────────────────────────────
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid json" }, { status: 400 });
        }

        const entry = body?.entry?.[0];
        const change = entry?.changes?.[0];
        const field = change?.field;
        const value = change?.value;

        // Non-message events (account_alerts, security, quality_updates, etc.)
        if (field && field !== "messages") {
          console.log(`[WA Event: ${field}]`, JSON.stringify(value).slice(0, 200));
          return Response.json({ status: "acknowledged", field }, { status: 200 });
        }

        const messages = value?.messages;
        if (!messages?.length) {
          return Response.json({ status: "ignored", reason: "no messages" }, { status: 200 });
        }

        const message = messages[0];
        const senderPhone: string = message.from || "unknown";
        const messageType: string = message.type;

        if (!["image", "video", "document"].includes(messageType)) {
          return Response.json(
            { status: "ignored", reason: `non-media type: ${messageType}` },
            { status: 200 },
          );
        }

        const mediaObj = message[messageType] || {};
        const mediaId: string = mediaObj.id || "";
        const caption: string = mediaObj.caption || "";
        const mimeType: string =
          mediaObj.mime_type ||
          (messageType === "video"
            ? "video/mp4"
            : messageType === "document"
              ? "application/pdf"
              : "image/jpeg");

        const fileName = sanitizeFileName(
          caption || mediaObj.filename || `wa_${messageType}_${Date.now()}`,
          mimeType,
        );
        const { category, tags } = extractCategoryAndTagsFromCaption(caption || fileName);
        const storagePath = `whatsapp/${senderPhone}/${Date.now()}_${fileName}`;

        const waToken = process.env.WHATSAPP_API_TOKEN;
        const db = await getAdminDb();

        // Diagnostics
        console.log(
          `[WA] 🔍 mediaId=${mediaId} hasToken=${!!waToken} tokenLen=${waToken?.length ?? 0}`,
        );
        console.log(`[WA] 🔍 messageType=${messageType} mimeType=${mimeType} fileName=${fileName}`);

        // Resolve the real tenant_id from DB (FK-safe — never hardcode)
        let tenantId: string;
        try {
          tenantId = await getDefaultTenantId(db);
          console.log(`[WA] 🏠 tenantId=${tenantId}`);
        } catch (err) {
          console.error("[WA] Could not resolve default tenant:", err);
          return Response.json({ error: "tenant not found" }, { status: 500 });
        }

        // ── PIPELINE ─────────────────────────────────────────────────────────
        let permanentUrl = "";
        let downloadedBytes = 0;
        let uploadSuccess = false;

        if (!waToken) {
          console.error("[WA] ❌ WHATSAPP_API_TOKEN env var is not set — skipping media download");
        } else if (!mediaId) {
          console.error("[WA] ❌ mediaId is empty — cannot fetch media from Meta");
        } else {
          // 1. Get temporary Meta CDN URL
          console.log(`[WA] ⬇️  Step 1: fetching Meta CDN URL for mediaId=${mediaId}`);
          const metaTempUrl = await fetchMetaMediaUrl(mediaId, waToken);
          console.log(
            `[WA] Step 1 result: metaTempUrl=${metaTempUrl ? metaTempUrl.slice(0, 60) + "..." : "NULL"}`,
          );

          if (metaTempUrl) {
            // 2. Download binary from Meta CDN
            console.log(`[WA] ⬇️  Step 2: downloading binary from Meta CDN`);
            const binary = await downloadBinary(metaTempUrl, waToken);
            console.log(
              `[WA] Step 2 result: binary=${binary ? binary.buffer.byteLength + " bytes" : "NULL"}`,
            );

            if (binary) {
              downloadedBytes = binary.buffer.byteLength;
              // 3. Upload to Supabase Storage
              console.log(
                `[WA] ⬆️  Step 3: uploading to Supabase Storage bucket="${STORAGE_BUCKET}" path="${storagePath}"`,
              );
              const pubUrl = await uploadToStorage(
                db,
                storagePath,
                binary.buffer,
                binary.contentType,
              );
              console.log(`[WA] Step 3 result: pubUrl=${pubUrl ?? "NULL"}`);

              if (pubUrl) {
                permanentUrl = pubUrl;
                uploadSuccess = true;
              }
            }
          }
        }

        // Fallback URL if pipeline failed
        if (!permanentUrl) {
          permanentUrl = `https://wtudcippyxbaobqzbmok.supabase.co/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
          console.warn(`[WA] ⚠️ Using constructed fallback URL`);
        }

        // ── Save to media_files ───────────────────────────────────────────
        const insertPayload = {
          tenant_id: tenantId,
          file_name: fileName,
          file_path: storagePath,
          file_url: permanentUrl,
          file_type: (messageType === "video" ? "video" : "image") as "image" | "video" | "other",
          mime_type: mimeType,
          size_bytes: downloadedBytes || mediaObj.file_size || 0,
          source: "whatsapp",
          metadata: {
            whatsapp_message_id: message.id || `wa_${Date.now()}`,
            sender_phone: senderPhone,
            whatsapp_media_id: mediaId || null,
            caption,
            category,
            tags,
            thumbnail_url: messageType === "video" ? null : permanentUrl,
            upload_success: uploadSuccess,
            received_at: new Date().toISOString(),
          },
        };

        const { data: mediaRecord, error: insertError } = await db
          .from("media_files")
          .insert(insertPayload)
          .select("id")
          .single();

        if (insertError) {
          console.error("[WA] media_files insert error:", insertError.message);
        }

        const mediaFileId = mediaRecord?.id || null;
        console.log(
          `[WA] 📦 media_file saved: id=${mediaFileId} upload=${uploadSuccess} bytes=${downloadedBytes}`,
        );

        return Response.json(
          {
            status: "success",
            mediaFileId,
            fileName,
            permanentUrl,
            uploadSuccess,
            category,
            tags,
            bytes: downloadedBytes,
          },
          { status: 200 },
        );
      },
    },
  },
});
