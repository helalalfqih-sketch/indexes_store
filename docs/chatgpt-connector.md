# Indexes Store ChatGPT connector

The MCP endpoint is `https://indexes-store.vercel.app/api/mcp` **after this change is deployed**. A website home page is not an MCP endpoint.

This first connector exposes three read-only tools: `search`, `fetch`, and `get_store_info`. It reads the live, published Shopify Storefront catalog already configured for this website. It does not expose customer/order data, private products, exact inventory quantities, cost prices, or mutation tools. No credentials are required in ChatGPT for this public catalog connection. Upstream failures return explicit errors, never sample products or guessed prices.

## Connect after deployment verification

1. In ChatGPT settings, enable Developer mode if available to your account.
2. In Plugins, choose `+` / create a connection.
3. Name: **Indexes Store — اندكس ستور**.
4. MCP server URL: `https://indexes-store.vercel.app/api/mcp`.
5. Authentication: **None** (public catalog only).
6. Create the connection and check the three advertised tools. Test a product search and fetch a returned product ID.

Do not claim that the user has connected the plugin until this client-side registration and tool test succeed. UI labels may differ by account/client. The endpoint supports stateless Streamable HTTP POST; GET returns 405 intentionally because no long-lived SSE channel is needed.

## Verification and controls

- Official TypeScript MCP SDK, bounded page size (20), request-body limit, strict schemas and origin validation.
- Source credentials remain on Vercel; the connector only reads the existing Storefront API configuration.
- `available` means available for sale. It is not an inventory count.
- Before adding private data or writes, implement OAuth 2.1 with PKCE, discovery metadata, resource/audience verification and per-tool user/store authorization. An unauthenticated public tool must never gain private or write access.
- Protect expensive public traffic using the deployment platform's rate limits as needed; the adapter uses bounded pages and timeouts.

Official references:

- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/deploy/connect-chatgpt
