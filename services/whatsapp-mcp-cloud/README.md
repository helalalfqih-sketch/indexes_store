# Indexes WhatsApp MCP Cloud

Experimental direct-QR WhatsApp MCP service. It is intentionally isolated from the storefront and does **not** use Whapi.

## Goal

One MCP URL:

```
https://<your-host>/mcp
```

Connection flow:

1. ChatGPT discovers OAuth + PKCE.
2. The OAuth page asks for the private link invite secret unless public signup is explicitly enabled.
3. The service creates an isolated WhatsApp linked-device session.
4. The user scans the displayed QR from **WhatsApp → Linked devices → Link a device**.
5. The OAuth access token is bound to that exact WhatsApp session.
6. MCP calls are routed only to that session.

## Current MVP

- Streamable HTTP MCP
- OAuth 2.0 authorization-code + PKCE S256
- Dynamic client registration
- QR linked-device login
- Multiple isolated sessions
- AES-256-GCM encrypted Baileys auth files
- Status / recent chats / recent observed messages
- One explicitly confirmed text-send tool
- No bulk send, no group administration, no destructive chat tools

## Runtime choice

This service uses Baileys pinned to upstream commit
`0af2386292907f7d9742d8d41f830d8c48208fa1`.

Baileys is an unofficial WhatsApp Web client library and is not affiliated with or endorsed by WhatsApp/Meta. The upstream project explicitly warns against spam or Terms-of-Service violations. Use only with accounts you control.

Because WhatsApp linked-device sessions keep long-lived WebSocket connections, deploy this as a persistent Docker service (for example Render/Fly/Railway or a VPS) with a persistent `/data` volume. **Do not deploy this session worker on Vercel serverless.**

## Required environment

Copy `.env.example` and set:

- `ORIGIN` — public HTTPS origin.
- `WA_SESSION_MASTER_KEY` — exactly 32 random bytes encoded as base64.
- `OAUTH_SIGNING_SECRET` — at least 32 random characters.
- `WA_LINK_INVITE_SECRET` — closed-by-default human gate for starting a new QR link.
- `DATA_DIR=/data` — persistent volume.

Keep `ALLOW_PUBLIC_SIGNUP=false` for the Indexes deployment.

## Security boundary

- Each OAuth token contains one session ID; MCP tools never accept a session ID from the model.
- Session auth state is encrypted at rest with AES-256-GCM.
- QR tickets expire after 10 minutes.
- Authorization codes expire after 5 minutes.
- Access tokens expire after 1 hour; refresh tokens after 30 days.
- Redirect URIs must be HTTPS and match the configured allow-list.
- Writes require `confirmed: true`.

## Before production

The MVP intentionally keeps only recent observed chat/message summaries in RAM. Before production rollout, add a bounded encrypted database for message metadata, rate limits on OAuth/link endpoints, CSRF protection on the invite form, one-time authorization-code replay protection, session revocation UI, and CI integration tests against a disposable WhatsApp test account.
