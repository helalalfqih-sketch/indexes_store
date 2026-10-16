# Indexes WhatsApp MCP — authorized Meta Cloud preview (16 October 2026)

## Scope and truth gate

This changes an existing Indexes WhatsApp MCP implementation on a GitHub review branch.
It is not a connected or deployed WhatsApp replacement, and does not claim feature
parity with Whapi. The target channel is the merchant's WhatsApp Business Account
for Indexes Store. Provider IDs must be checked against the merchant's own account
in the official Meta business interface; never paste provider access tokens into chat.

The official Meta Graph adapter provides first-party business messaging, signed
inbound message/status events, and media metadata. This preview does **not**
claim access to historical personal chats, existing personal groups, their members,
channel publishing or channel administration. Meta group eligibility and any
other restricted provider capability require official up-to-date documentation and
actual account approval before implementing. A BSP or Zapier integration cannot
silently grant capabilities excluded by the underlying provider API.

### Preview architecture

- Existing route /api/mcp/whatsapp remains one MCP plugin; it uses Meta-only
  tools when BOTH VERCEL_ENV=preview and INDEXES_WA_META_PREVIEW_ENABLED=true.
- Meta-only preview OAuth uses a separately configured
  INDEXES_WHATSAPP_MCP_OAUTH_SECRET, not the Whapi webhook secret.
- On all other environments the legacy WhatsApp MCP endpoint behaves as before.
- The preview issuer is HTTPS on the exact VERCEL_URL; never share production tokens
  with preview, and connect a new preview MCP client only after deployment review.
- GET/POST /api/webhooks/whatsapp-cloud-preview is 404 on production.
  GET implements official challenge verification; POST verifies X-Hub-Signature-256
  before processing the limited payload.
- POST records only bounded message/status fields in a separate Supabase **staging**
  database with a unique provider event key; no raw webhook payload is persisted.
- If database storage is unavailable, POST responds 503 instead of falsely
  acknowledging receipt. Signed non-message events are safely ignored.
- The preview MCP may read exact WABA business phone metadata, owned media metadata,
  and up to 30 bounded staging events.
- One TEST-only text send method exists but is disabled by default, requires explicit
  per-message confirmation and matches one server-side allowlisted test recipient.
  It does not send automatically; even HTTP acceptance is not proof of delivery.

### Required private preview environment

Configure only after approving an isolated preview deployment and staging database:

- VERCEL_ENV=preview (host-provided)
- VERCEL_URL=<your real preview host>.vercel.app (host-provided)
- INDEXES_WA_META_PREVIEW_ENABLED=true
- INDEXES_WHATSAPP_MCP_OAUTH_SECRET=<unique independent 32+ character server secret>
- INDEXES_WA_META_PREVIEW_WABA_ID=<exact merchant WABA from Meta>
- INDEXES_WA_META_PREVIEW_PHONE_ID=<exact verified phone ID from Meta>
- INDEXES_WA_META_GRAPH_VERSION=<provider-supported version, e.g. v25.0 only if documented>
- INDEXES_WA_META_PREVIEW_ACCESS_TOKEN=<authorized token with narrowly required scopes>
- INDEXES_WA_META_PREVIEW_APP_SECRET=<dedicated Meta application secret, 32+ chars>
- INDEXES_WA_META_PREVIEW_VERIFY_TOKEN=<dedicated webhook verification token, 24+ chars>
- INDEXES_WA_META_PREVIEW_DB_REF=<independent reviewed staging Supabase project ref>
- SUPABASE_URL=<corresponding staging project URL>
- SUPABASE_SERVICE_ROLE_KEY=<staging server-only key>
- INDEXES_WA_META_PREVIEW_SEND_ENABLED=false
- INDEXES_WA_META_PREVIEW_TEST_RECIPIENT=<empty until a specific test is approved>

Do not set these in Production or VITE_ variables. No customer messages should be
routed to preview until private data handling, retention period, deletion process,
rate limits, monitoring, webhook subscription and staging credentials are reviewed.

### Stage-only SQL and rollout

The migration is in supabase/migrations/20261016170000_whatsapp_cloud_preview_inbox.sql.
Do NOT run it on the production database. Apply it only to a separately approved
staging instance; check unique index, absence of anon/authenticated access, RLS,
webhook duplicate behavior, provider registration and monitoring. Agree a retention
period and purge process before admitting real customer messages.

The former Indexes production project ref wtudcippyxbaobqzbmok is explicitly rejected
by the preview runtime guard. Do not assume other accessible Supabase projects are
staging solely because their IDs differ. This does not replace a full environment audit.

### Next gates before activating any real integration

1. Verify current Meta documentation and granted scopes directly from the merchant's
   account. At this stage access is confirmed only for a Zapier WABA listing, not for
   this repository's preview server secrets or a successful send/receive handshake.
2. Review provider/account ownership and any phone-app coexistence requirements.
3. Provide an isolated Supabase staging project and apply the migration there.
4. Deploy reviewed branch to an isolated Preview. Verify OAuth registration,
   phone ownership, app secret verification, valid/invalid signed webhooks,
   duplicate messages, recent-event reads, media metadata and token revocation.
5. Use one approved test recipient to test a real inbound/outbound exchange only
   after separate consent. Confirm delivery status through provider events.
6. Keep groups/channels marked as unsupported in this adapter unless an official
   eligible integration, verified permissions and tests establish the contrary.
7. Do not merge, publish a theme, activate customer automation, or remove Whapi
   before a human-reviewed rollback plan and completed end-to-end tests.

References already present in the source project: the existing Meta webhook adapter
at src/routes/api/webhooks.whatsapp.ts and the current WhatsApp MCP/OAuth handlers at
src/lib/mcp/whatsapp-handler.server.ts and whatsapp-oauth.server.ts.
