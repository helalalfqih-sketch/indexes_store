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

## V2 guarded development control plane

The connector also advertises the optional `store.develop` OAuth scope. Development tools are
server-side GitHub operations pinned to `helalalfqih-sketch/indexes_store`.

V2 tools:
- `development_repository`
- `read_source_file`
- `search_source_code`
- `create_development_branch`
- `patch_source_file`
- `create_development_pr`

Write guardrails:
- source writes are accepted only on `agent/*` branches;
- branch creation is from `main` only;
- file replacement requires the exact current blob SHA;
- environment, Vercel, Git internals, dependency directories, and secret-like paths are blocked;
- pull requests are created as drafts;
- V2 cannot merge, deploy, execute shell commands, read secrets, run migrations, or write Store data.

The server-only `STORE_MCP_GITHUB_TOKEN` credential is required for development tools. It must be a
fine-grained GitHub token restricted to the single repository with the minimum Contents and Pull
Requests permissions required. The token is never returned through MCP.

