# Indexes Store private MCP connector

Endpoint: `https://indexes-store.vercel.app/api/mcp/store`

This connector is an OAuth-protected, tenant-bound, read-only administration surface. It exposes
health, product search and detail, catalog quality, inventory, order summary, CMS page metadata,
runtime incidents, and audit-log reads. It has no write, publish, delete, migration, deployment, or
secret-reading tools.

OAuth uses Authorization Code with PKCE and dynamic client registration. The approving user must
be an authenticated application administrator. The issued access token contains the tenant resolved
from that administrator's ownership or membership; tool inputs cannot override it.

`STORE_MCP_OAUTH_SECRET` is the preferred server-only signing secret. Existing deployments may use
`WHAPI_WEBHOOK_SECRET` as a compatibility fallback; the derived signing key is domain-separated from
the WhatsApp connector.
