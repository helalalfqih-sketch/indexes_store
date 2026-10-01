import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { config } from "./config.js";
import {
  authorizePage,
  linkPage,
  linkStatus,
  oauthMetadata,
  registerClient,
  resourceMetadata,
  startAuthorization,
  tokenResponse,
} from "./oauth.js";
import { handleMcp } from "./mcp.js";

const app = new Hono();

app.get("/", (c) =>
  c.html(`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>Indexes WhatsApp MCP Cloud</title>
<body style="font-family:system-ui;max-width:720px;margin:8vh auto;padding:24px"><h1>Indexes WhatsApp MCP Cloud</h1>
<p>خدمة ربط WhatsApp Multi‑Device عبر OAuth + QR. رابط MCP: <code>${config.origin}/mcp</code></p>
<p>هذه الخدمة غير تابعة لـWhatsApp أو Meta.</p></body></html>`),
);

app.get("/.well-known/oauth-authorization-server", (c) => c.json(oauthMetadata()));
app.get("/.well-known/oauth-protected-resource", (c) => c.json(resourceMetadata()));
app.get("/.well-known/oauth-protected-resource/mcp", (c) => c.json(resourceMetadata()));

app.post("/oauth/register", async (c) => {
  try {
    return c.json(registerClient(await c.req.json()));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_client_metadata" }, 400);
  }
});

app.get("/oauth/authorize", (c) => {
  try {
    return c.html(authorizePage(new URL(c.req.url).searchParams));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_request" }, 400);
  }
});

app.post("/oauth/authorize/start", async (c) => {
  try {
    const target = await startAuthorization(await c.req.formData());
    return c.redirect(target, 303);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_request" }, 400);
  }
});

app.get("/link", (c) => {
  try {
    return c.html(linkPage(c.req.query("ticket") ?? ""));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_ticket" }, 400);
  }
});

app.get("/link/status", async (c) => {
  try {
    return c.json(await linkStatus(c.req.query("ticket") ?? ""));
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "invalid_ticket" }, 400);
  }
});

app.post("/oauth/token", async (c) => {
  try {
    const text = await c.req.text();
    return c.json(await tokenResponse(new URLSearchParams(text)), 200, {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    });
  } catch (error) {
    return c.json(
      { error: error instanceof Error ? error.message : "invalid_grant" },
      400,
      { "Cache-Control": "no-store" },
    );
  }
});

app.on(["POST", "OPTIONS"], "/mcp", async (c) => handleMcp(c.req.raw));
app.get("/mcp", async (c) => handleMcp(c.req.raw));

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Indexes WhatsApp MCP Cloud listening on :${info.port}`);
});
