# WaAPI.app integration: Indexes WhatsApp MCP preview (16 October 2026)

## Scope

The operator supplied WaAPI's API reference and the portal record for instance
**106235** (Trial, "اندكس للتجارة", status displayed as "Ready"). The portal
status is NOT proof that authenticated API reads, group/channel operations,
historical messages, or webhook delivery work in practice.

This changes only a development branch, NOT main or the active WaAPI instance.
It extends the EXISTING Indexes WhatsApp MCP endpoint rather than creating
another cosmetic app. Production's Whapi integration is not disconnected.

**WaAPI.app is a third-party WhatsApp Web-style service, NOT Meta's official
WhatsApp Cloud API.** Vendor availability, account restrictions, beta features
and WhatsApp platform policy risks must be evaluated before production use.
A vendor's documented group/channel operation does not establish permission
from Meta or successful access to the user's communities.

## What the supplied vendor documentation actually establishes

- Instance list/create/retrieve/update/delete operations, client status and QR.
- Send text/media, get/search messages, download media, inspect/edit chats.
- Group participant information and administration.
- Channel create/list/lookup/search/subscribe/unsubscribe operations. The
  pasted reference does not list channel-post publication. Never claim it.
- Community operations marked BETA by the vendor.
- Webhooks: the exact documented registration endpoint is
  `POST https://waapi.app/api/v1/instances/{id}/webhooks`.
  It accepts URL, events, source (zapier/make/n8n/api), returns 201 for
  creation and 200 for an already-registered URL. Up to 25 active subscriptions
  per instance. The vendor lists 27 event names including message, media,
  group changes, community changes and status.
- The supplied page says optional `X-Hook-Secret` on subscription registration
  is stored and echoed back in the RESPONSE header. It does NOT prove the
  authentication, MAC/signature or contents of subsequent incoming callbacks.
  **Do not register webhooks or ingest production customer events before this
  is verified.**
- The GET paths for "retrieve instance" and "list webhook subscriptions"
  in the read-only adapter are inferred from REST resource conventions; their
  exact full reference pages must be checked before enabling the preview.
  They are NOT asserted as verified WaAPI endpoints in this project.
- All write operations (including group membership changes, public posts,
  customer replies, new subscriptions and token changes) remain disabled.

## Preview execution boundary

- Only when `VERCEL_ENV=preview` AND
  `INDEXES_WA_WAAPI_PREVIEW_ENABLED=true`, the existing WhatsApp MCP serves
  `waapi_preview_*` read-only tools instead of Whapi tools.
- `INDEXES_WA_META_PREVIEW_ENABLED=true` and WaAPI enabled together is rejected.
- Preview OAuth issuer uses the actual `VERCEL_URL` and the independent
  `INDEXES_WHATSAPP_MCP_OAUTH_SECRET`; no Whapi webhook key reuse.
- The vendor API Token must be stored server-only in a *Preview*-scoped secret,
  with **read** permission only. Do NOT include it in Git, browser JS, or chat.
- Tools: capability manifest, exact instance metadata, subscription metadata
  with webhook URL paths redacted, and an offline subscription creation plan.
- The proposed callback `/api/webhooks/waapi-preview` always rejects POST
  with 503 until the inbound webhook verification contract and downstream
  isolated staging storage are validated. On production it is 404.
- Does not download chat/media, alter settings, send messages or even register
  the prepared subscription. No actual integration success is claimed.

## Preview variables (server secrets, not VITE_)

- `VERCEL_ENV=preview` (host supplied)
- `VERCEL_URL=<isolated-branch-preview>.vercel.app` (host supplied)
- `INDEXES_WA_WAAPI_PREVIEW_ENABLED=true` (manual preview scope only)
- `INDEXES_WA_META_PREVIEW_ENABLED=false`
- `INDEXES_WHATSAPP_MCP_OAUTH_SECRET=<separate 32+ random secret>`
- `INDEXES_WA_WAAPI_PREVIEW_INSTANCE_ID=106235`
- `INDEXES_WA_WAAPI_PREVIEW_API_TOKEN=<server-stored read-only API token>`

## Required review and next gates

1. Confirm exact WaAPI GET paths in the vendor docs for retrieve-instance and
   list-webhook-subscriptions; never treat conventional path inference as proof.
2. Confirm account/instance status with a read-only API token installed via
   the platform's secure secret UI. Explicitly avoid API Tokens with delete
   privileges. Do not post any tokens into the chat.
3. Confirm vendor's actual incoming callback authentication contract. The
   optional registration-time `X-Hook-Secret` echo alone is insufficient.
4. Choose an isolated staging database and approve narrow retention and
   deletion policies before admitting customer messages.
5. Run unit tests, typecheck, security checks, CI and a real Preview smoke test
   with unauthenticated endpoints rejecting correctly. All results must be
   recorded, not inferred.
6. Only with separately documented approval and successful provider API
   readback: register at most one exact non-production webhook subscription
   and test events from a controlled authorized account.
7. Do not enable writes, group/channel changes, real messages, delete actions,
   Shopify catalog updates or production deployment without explicit review.

Related reference: `docs/whatsapp-cloud-preview.md` is a separate Meta Cloud
API preview. WaAPI and Meta are separate provider adapters, not interchangeable
OAuth sessions or permission grants.
