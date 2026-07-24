import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeFileName, extractCategoryAndTagsFromCaption } from "@/lib/whatsapp.functions";

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      // 1. Verification Handshake (GET) for Meta Webhook v25.0
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "indexes_wa_secret_verify_2026";

        if (mode === "subscribe" && token === expectedToken) {
          console.log("[WhatsApp Webhook v25.0] Handshake verification successful");
          return new Response(challenge || "OK", { status: 200 });
        }

        console.warn("[WhatsApp Webhook v25.0] Verification failed: token mismatch");
        return new Response("Forbidden", { status: 403 });
      },

      // 2. Incoming Subscribed Events (POST) for v25.0 (messages, account_alerts, quality_updates, security)
      POST: async ({ request }) => {
        try {
          const body = await request.json();

          // Validate Meta payload structure
          const entry = body?.entry?.[0];
          const change = entry?.changes?.[0];
          const field = change?.field;
          const value = change?.value;

          // Handle Account Alerts & Security Field Notifications
          if (field && field !== "messages") {
            console.log(`[WhatsApp Webhook v25.0 Event: ${field}]`, value);
            return Response.json({ status: "acknowledged", field }, { status: 200 });
          }

          const messages = value?.messages;
          if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return Response.json({ status: "ignored", reason: "no messages" }, { status: 200 });
          }

          const message = messages[0];
          const senderPhone = message.from || "967738609222";
          const messageType = message.type; // image, video, document, text

          if (!["image", "video", "document"].includes(messageType)) {
            return Response.json({ status: "ignored", reason: "non-media message" }, { status: 200 });
          }

          const mediaObj = message[messageType];
          const mediaId = mediaObj?.id;
          const caption = mediaObj?.caption || "";
          const mimeType = mediaObj?.mime_type || (messageType === "video" ? "video/mp4" : messageType === "document" ? "application/pdf" : "image/jpeg");

          let mediaUrl = "";
          const fileName = sanitizeFileName(caption || mediaObj?.filename || "", mimeType);
          const { category, tags } = extractCategoryAndTagsFromCaption(caption || fileName);

          // Fetch media URL from Meta Graph API v25.0
          const waToken = process.env.WHATSAPP_API_TOKEN;
          if (waToken && mediaId) {
            try {
              const graphRes = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
                headers: { Authorization: `Bearer ${waToken}` },
              });
              if (graphRes.ok) {
                const graphData = await graphRes.json();
                mediaUrl = graphData.url || "";
              }
            } catch (err) {
              console.warn("[WhatsApp Webhook v25.0] Meta API download error:", err);
            }
          }

          // Fallback if mediaUrl wasn't fetched
          if (!mediaUrl) {
            mediaUrl = `https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/whatsapp_imports/${fileName}`;
          }

          // Get DB client
          let db = supabase;
          if (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            if (supabaseAdmin) db = supabaseAdmin;
          }

          // Insert into media_files
          const payload = {
            tenant_id: "00000000-0000-0000-0000-000000000001",
            file_name: fileName,
            file_path: `whatsapp/${fileName}`,
            file_url: mediaUrl,
            file_type: messageType === "video" ? "video" : "image",
            mime_type: mimeType,
            size_bytes: mediaObj?.file_size || 1024000,
            source: "whatsapp",
            metadata: {
              whatsapp_message_id: message.id || `wa_msg_${Date.now()}`,
              sender_phone: senderPhone,
              whatsapp_media_id: mediaId || null,
              caption,
              category,
              tags,
              received_at: new Date().toISOString(),
            },
          };

          await db.from("media_files").insert(payload as any);

          return Response.json({ status: "success", mediaUrl, fileName, category, tags }, { status: 200 });
        } catch (error: any) {
          console.error("[WhatsApp Webhook v25.0] Handler error:", error);
          return Response.json({ error: error.message || String(error) }, { status: 500 });
        }
      },
    },
  },
});
