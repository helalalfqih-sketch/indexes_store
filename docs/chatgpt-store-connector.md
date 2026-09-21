# Indexes Store private MCP connector

Endpoint: `https://indexes-store.vercel.app/api/mcp/store`

This connector is an OAuth-protected, tenant-bound, read-only administration surface. It exposes
health, product search and detail, catalog quality, inventory, order summary, CMS page metadata,
runtime incidents, and audit-log reads. It has no write, publish, delete, migration, deployment, or
secret-reading tools.

OAuth uses Authorization Code with PKCE and dynamic client registration. The approving session must
belong to an owner or manager of exactly one tenant. The issued access token is bound to that tenant;
tool inputs cannot override it. If the session can administer multiple tenants, authorization fails
closed until an explicit server-side tenant-selection flow is implemented.

`STORE_MCP_OAUTH_SECRET` is the required server-only signing secret. The Store connector does not use
WhatsApp credentials or WhatsApp authentication helpers.
