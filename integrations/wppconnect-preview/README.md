# Indexes WhatsApp MCP — isolated WPPConnect experiment

This is a **read-only preview experiment**, not a replacement deployed to the
production Indexes WhatsApp connector. It is isolated in its own directory and
branch; neither the existing `src/lib/mcp/whatsapp-handler.server.ts` nor its
production secrets, phones, database, webhooks or Shopify data are changed.

## What is implemented

- Five executable MCP stdio tools: capabilities, test-phone identity, bounded
  chat/group/channel metadata, approved-chat messages and approved-message media.
- Exact test-session binding; known production phone numbers rejected before I/O.
- The server is reachable only at `http://127.0.0.1:22465`; no caller-supplied URL.
- A separate session token, not the administrative key, authorizes content reads.
- Group/channel/message IDs are validated. Message/media content additionally
  requires an exact server-side chat allowlist and per-message chat verification.
- The POST `list-chats` and `manager/verify` endpoints are read/authentication
  operations, NOT message sending. No send, delete, publish, group membership,
  pairing, restart, or webhook-writing operation is exposed as an MCP tool.
- Each response is bounded; network calls have a deadline and refuse redirects.
  Binary media is capped at 4 MiB; images use MCP image content and video/PDF/audio
  use embedded resource blobs. No public media URL is invented or published.
- Static tools/dispatcher exports can be reused by the existing authenticated MCP
  once its separate preview deployment and authorization review are approved.
  **This package does not publish a remote ChatGPT OAuth endpoint.**

## Honest validation boundary

`npm test` uses **synthetic provider data**, including a real localhost HTTP
fixture and a real Node subprocess speaking newline-delimited MCP JSON-RPC.
These tests do not log into WhatsApp and do not prove live media/group delivery.
`npm run smoke:server` instead tests a real WPPConnect container's Manager/API,
unauthenticated rejection and empty fresh session store, without starting any
WhatsApp session. It is a separate gate, not replaced by fixture tests.

## Start the isolated container (Docker required)

Run in this directory only:

```sh
node prepare.mjs
docker compose up -d
npm run smoke:server
```

`prepare.mjs` generates an independent random admin secret in a local `.env`
file (0600) and refuses to overwrite an existing one. It does not print the key.
The fixed compose project is `indexes-wpp-preview-20261016`, with independent
named volumes and loopback-only port 22465. No production folder is mounted.
The reviewed source's image tag is pinned to `2.10.55`; the actual pulled digest
and runtime API version must be recorded by the runtime check. No guarantee is
made that a mutable Docker tag equals the source SHA below.

After successful startup, the Manager is at:
`http://127.0.0.1:22465/manager/` on that Docker host, not a public URL.
Do not claim this address is available until the runtime check has passed.

## Real-account gate — requires a separate test phone

Do not connect `967771370740`, `967772565855`, `17115864259`, or any other
production number. No session is created or paired automatically. An owner must
approve and perform pairing in the local Manager for the test-only session
`indexes_wa_test_20261016`; permissions and any test group/channel must be owned
or explicitly authorized. Never paste tokens, cookies or QR codes into chat.

Store the session token and approved phone privately in `.client.env`:

```dotenv
INDEXES_ENV=preview
WPP_PREVIEW_ENABLED=true
WPP_SESSION=indexes_wa_test_20261016
WPP_ORIGIN=http://127.0.0.1:22465
WPP_SESSION_TOKEN=<session-only token entered in local secret storage>
WPP_EXPECTED_TEST_PHONE=<authorized test phone digits, no +>
WPP_APPROVED_CHAT_IDS=<exact authorized test chat IDs, comma-separated>
```

```sh
node --env-file=.client.env stdio.mjs
```

No real phone/token/allowlist ships with this package. Metadata lists concern only
the separately approved test phone; message contents remain denied until the
specific test chat is allowlisted. The bridge never changes a chat's read marker.

## Remaining gates

1. Runtime Manager/container smoke, with image digest and no account sessions.
2. Approved test phone pairing and identity check; actual group/channel reads,
   original image/video retrieval, reconnect and unavailable-history behavior.
3. Existing Indexes MCP preview authorization, revocation, per-account scoping,
   remote HTTPS/transport review, audit and retention controls before deployment.
4. Separate approval and tests for any eventual sends, channel publishing or
   group administration. None are provided by this read-only experiment.

WPPConnect exports WhatsApp Web functions; it is NOT Meta Cloud API and no Meta
approval is asserted. Upstream changes can affect compatibility or account access.
No anti-detection configuration, rate-limit evasion or credential extraction is
added here. Open source does not make hosting and maintenance free, nor does it
prove that all historical messages/media remain retrievable.

## Rollback / stop (this experiment only)

```sh
docker compose stop
```

This retains test volumes. Do not run broad Docker prune commands. Remove only
this compose project after checking there is no test data that must be retained.
Closing the draft PR leaves production unchanged; do not merge automatically.

## Source inspected for this experiment

WPPConnect Server commit `a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d`:
- [API routes](https://github.com/wppconnect-team/wppconnect-server/blob/a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d/src/routes/index.ts)
- [Manager auth protocol](https://github.com/wppconnect-team/wppconnect-server/blob/a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d/docs/manager.md)
- [Phone/chat/message controllers](https://github.com/wppconnect-team/wppconnect-server/blob/a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d/src/controller/deviceController.ts)
- [Media retrieval](https://github.com/wppconnect-team/wppconnect-server/blob/a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d/src/controller/sessionController.ts)
- [Image layout](https://github.com/wppconnect-team/wppconnect-server/blob/a6a6a8449d544d7dfbdc6570dc3b4208d3c9703d/Dockerfile)
