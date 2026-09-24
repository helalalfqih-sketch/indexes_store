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

### OAuth client registration compatibility

ChatGPT performs dynamic client registration once per connection and reuses the resulting
public `client_id`. New Store registrations are signed, persistent identifiers, not access
tokens. Discovery-version updates must not rotate the client kind or signing key to force
tool rediscovery. Existing `store_client`, `store_client_v2`, and `store_client_v3` registrations
remain accepted only with a valid current signature, exact registered redirect URI, and their
original expiry. Expired legacy registrations and credentials signed with another key are
not revived. Access tokens, refresh tokens, and authorization codes still expire normally;
PKCE, admin consent, tenant binding, and approved scopes are unchanged.

Authorization errors retain `client_registration_invalid` and add a sanitized
`registration_issue` (`invalid_signature`, `unsupported_version`, `redirect_mismatch`, or
`expired`). No client IDs, tokens, state, cookies, or signing keys are returned or logged.
If an expired or invalidly signed cached registration remains after an upgrade, the client
must register again; refreshing an old authorization URL cannot repair that registration.

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

### Read-only site inspection

V2 also exposes same-origin inspection tools that can analyze the live Store without mutating it:
`inspect_site`, `inspect_page`, `inspect_navigation`, `inspect_forms`, and
`inspect_mobile_ui`.

These tools are intentionally read-only and currently inspect HTTP/HTML signals. They can enumerate
links, buttons, forms, controls, headings, SEO metadata, image-alt gaps, and responsive viewport
metadata. They do not submit forms, place orders, click destructive controls, or write data.

A later browser worker will add rendered DOM, viewport screenshots, safe click/navigation trials,
console/network capture, and Preview-vs-Production comparison. That worker must remain inspection-only;
source fixes continue through the guarded GitHub branch/PR path.

### Rendered browser inspection worker

V2 now includes read-only rendered-browser tools:
`inspect_rendered_page`, `inspect_console`, `inspect_network`, and `inspect_screenshot`.

The browser is restricted to the production Store origin. It may render pages at desktop/mobile
viewports and observe interactive DOM, console/page errors, failed requests, HTTP >=400 responses,
and screenshot metadata. Network inspection intentionally omits headers, cookies, credentials, and
request bodies. These tools do not submit forms, place orders, or perform write actions.

The worker currently targets the production Store origin only. Preview-origin inspection will be
introduced with an explicit Vercel deployment allowlist so arbitrary external URLs cannot be used as
a browser proxy.

### Safe interaction and Preview comparison

The browser worker now supports `trial_navigation` for same-origin link navigation only. It does not
click buttons, submit forms, place orders, authenticate, or execute destructive actions.

`compare_preview` accepts Production plus a Vercel hostname matching the fixed
`indexes-store-*.vercel.app` preview pattern. It renders both at the same viewport and compares
title, interactive-element count, and screenshot hash. Arbitrary Vercel projects and external hosts
remain blocked.

### Verification and release-readiness gates

Development branches can be inspected with `inspect_development_pr`, which returns the draft PR,
changed-file summary, exact head/base SHAs, and GitHub check-run state.

`release_readiness` is a stricter advisory gate. It requires the caller to provide the exact expected
40-character head SHA and fails readiness when that SHA changed, checks are incomplete/failed, the
combined commit status is not successful, or GitHub does not report a clean mergeable PR.

V2 deliberately stops here: readiness never performs merge or deployment. A later release capability
must consume this exact SHA and independently re-check the gates immediately before any merge.

`verify_production_source` provides post-release read-only verification of the current `main` SHA,
its GitHub check runs, and combined commit status. It does not claim that Vercel production is healthy;
runtime/site health must still be verified independently with Store health and browser inspection tools.
