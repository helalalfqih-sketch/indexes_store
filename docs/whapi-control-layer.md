# Whapi control layer — read-only preview

Scope: `helalalfqih-sketch/indexes_store`, PR #116, branch `feat/whapi-direct-integration`.
Target: `HAWKEY-KFHM7`, phone `967771370740`. The server checks both against `/health` before reading channel data. No n8n or Supabase Storage is used.

## Security boundary

- `WHAPI_TOKEN` and `WHAPI_WEBHOOK_SECRET` remain server-only Vercel secrets. Never use `VITE_`/`NEXT_PUBLIC_` or embed values in code, URLs, logs, chat, or browser storage.
- REST requests require the application's Supabase **user session** in the Authorization header. The provider token is NOT a caller credential.
- User validation uses `auth.getUser` and the existing `has_role(..., admin)` RPC. The deployment-wide channel is limited to platform admins, not tenant members. There is no email-based promotion, service-role fallback or development bypass in this integration.
- Fixed GET-only provider paths, bounded pagination/JSON, request timeouts, redirect rejection and private/no-store responses. Provider errors are sanitized; health does not return IP/device/profile information.
- Supabase is used only for existing authentication and roles, not WhatsApp media storage.

## Endpoints

`GET /api/whapi/health` — authenticated, sanitized live status.

`GET /api/whapi/read?resource=chats&count=20&offset=0`

Resources: `health`, `chats`, `messages`, `groups`, `channels`, `products`. For `messages`, supply `chatId` exactly as returned by the provider. Count is 1–50; offset is 0–10000. Each request fetches one page; it never automatically scans all customers.

The read adapters map to `/chats`, `/messages/list/{chatId}`, `/groups`, `/newsletters` and `/business/products`. They are implementation candidates covered by mocked tests; validate each response contract against the authorized live account before treating them as operational.

## Webhook is NOT ready for live delivery

`POST /api/webhooks/whapi` verifies a configurable shared-secret header and bounded JSON. It intentionally returns `503 WEBHOOK_PROCESSOR_NOT_CONFIGURED` rather than acknowledging/dropping events. Header support must be confirmed in the Whapi channel settings before registration. This is header authentication, not a claim of provider-native HMAC signing.

Do not replace the current channel webhook or disconnect Meta/Whapi. Read operations require no webhook. A durable, tenant-bound inbox with idempotency, retry handling and source restrictions is a separate phase.

## Verification and rollout

1. Keep secrets on the **Preview** environment of project `prj_xZKJ6jRqam8v7mBWZTGyOM0NJZEF` (team `team_CsjzCo3y7bJpZqibkxM9Arjy`). Do not use the second similarly named Vercel project.
2. Run unit tests, build (to generate TanStack routes), typecheck, lint/security and the P0 CI gates.
3. Test unauthenticated requests (401), non-admin requests (403), then a real platform-admin session and a one-item page per resource. Never paste session tokens into chat or URLs.
4. Do not mark the integration production-ready just because a build passes. Compare actual channel and phone, check runtime errors and ensure read calls do not mark messages read or send anything.
5. Keep PR draft until Preview and authorization checks are complete. Production/merge needs a separate decision.

The initial Preview `/health` smoke check on 2026-09-18 returned `AUTH` for the intended channel/phone. It validated outbound connectivity, not every read adapter or inbound delivery.

## Not implemented / not implied

- No sending, deleting, publishing, automatic replies, catalog mutations or supplier-product ingestion.
- No direct ChatGPT tool registration yet. REST deployment alone does not give this conversation access. A separately authenticated MCP/connector bridge with scoped read/write tools is still needed.
- No runtime proof of every provider read endpoint yet, and no migration of existing integrations.
