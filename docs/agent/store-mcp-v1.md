# Indexes Store MCP Bridge — V1 (Read Only)

Endpoint: `POST /api/mcp/store`

## Security contract

- The endpoint accepts only a valid Supabase user access token in
  `Authorization: Bearer <token>`.
- Every request must include an explicit tenant UUID in `x-tenant-id`.
- Every tool call must repeat the same UUID as `tenant_id`.
- The server verifies that the authenticated user is either a platform admin or
  a member of that tenant before exposing any data.
- All reads use the authenticated Supabase client and existing RLS policies.
  The service-role key is never used by this bridge.
- Responses are `no-store`; the endpoint has a conservative in-process rate
  limit of 60 requests per user and tenant per minute.
- V1 contains no create, update, delete, publish, rollback, migration, secret,
  checkout mutation, or deployment tools.

## Tools

1. `store_health`
2. `search_products`
3. `get_product`
4. `inspect_catalog`
5. `inspect_inventory`
6. `inspect_orders`
7. `inspect_pages`
8. `audit_log`

Order inspection intentionally excludes names, phones, addresses, emails and
notes. Audit inspection intentionally excludes actor emails and details
payloads.

## MCP transport

V1 is a stateless JSON-RPC 2.0 Streamable HTTP subset. It supports:

- `initialize`
- `notifications/initialized`
- `ping`
- `tools/list`
- `tools/call`

The negotiated MCP protocol version is `2025-06-18`.

## Example

```http
POST /api/mcp/store HTTP/1.1
Authorization: Bearer <supabase-user-access-token>
x-tenant-id: 11111111-1111-4111-8111-111111111111
Content-Type: application/json
Accept: application/json, text/event-stream

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "inspect_catalog",
    "arguments": {
      "tenant_id": "11111111-1111-4111-8111-111111111111",
      "sample_limit": 25
    }
  }
}
```

## Deliberately deferred

V1 reuses authenticated Supabase sessions. Public OAuth discovery and delegated
authorization metadata for third-party connector onboarding are not included
yet. Add them in a separate reviewed change after the read-only endpoint and
tenant isolation tests pass in Preview.

Likewise, persistent runtime-error inspection requires a real tenant-scoped
error store. The existing mock audit service is not used as production
evidence.
