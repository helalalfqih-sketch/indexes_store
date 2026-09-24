# Store Admin V3: evidence-first QA

This draft is a foundation, not a completed V3 release. It is independent of UI PR #133 and based on main 291113f0.

## Contract implemented in this draft

- `inspect_ui_tree`: bounded rendered DOM snapshot; explicit stable keys from `data-element-key`, `data-testid`, or ID, scoped by section and product. Missing and ambiguous keys are reported, never synthesized from array positions. Visibility means rendered, not necessarily inside viewport.
- `try_safe_click`: `store.test` required. Fresh browser context with Service Workers blocked. Only explicitly instrumented `data-qa-action="local"` buttons outside forms are eligible. Ambiguous selectors are rejected. A key can replace a selector. Non-GET/HEAD requests and external navigation are blocked before clicking. Returns before/after state, observed changes, errors and blocked requests. A click is OBSERVED, never automatically a functional PASS. Observation window is 500ms, not proof of causal attribution or completion.
- `inspect_product_grid`: loaded cards only, exact numeric attributes in YER; missing inventory remains null. These are UI-prop observations, not a new source of authoritative inventory.
- `inspect_filter_state`: explicit CategoryBar state; absent instrumentation is NOT_TESTED. Search query instrumentation and mathematical filter assertions remain to implement.
- `full_store_audit`: runs five fixed routes × two viewports, with nine versioned check IDs per route/device and explicit scope. After a 40-second scheduling budget, remaining rows are BLOCKED (the in-flight page has its own navigation timeout). It does NOT claim a complete site crawl. Four planned checks remain NOT_TESTED; snapshots cannot pass an unimplemented journey or axe test. Counts include BLOCKED and NOT_TESTED in the denominator. No invented 281-check matrix.
- OAuth propagates requested scopes through consent, code exchange, refresh and token responses. Default is store.read. Existing grants never acquire store.test through refresh. Consent is required for new scopes. Source development remains under existing store.develop guards.

## Remaining implementation matrix

| Capability | State / next acceptance gate |
|---|---|
| UI tree / stable keys | Foundation implemented; instrument all visible controls, parent/component hierarchy and source manifest |
| Before/after state | Foundation implemented; bounded settling, failed-request attribution and comprehensive local actions |
| Product/filter evidence | Foundation implemented; inventory provenance, complete sections, exact filter/sort assertions and reset baseline |
| Product placement trace | Add grouped section trace and traversal of lazy-loaded grids |
| Filter actions and search | Add session-contained scripted actions and query/empty-state assertions |
| Customer journey | Product/cart/quantity/checkout entry under isolated test contract; never submit orders or WhatsApp |
| Screenshots/layout | Return actual MCP image content, multi-viewport overflow/clipping/overlap/tap-target checks |
| Accessibility | axe integration with element evidence, rule severity and mapped sources |
| Performance | Lab timing/weights separate from field CWV; never fabricate field metrics |
| SEO/crawl | Build bounded route inventory and canonical/schema/robots/sitemap checks; PR #133 carries alias fix |
| Journey recording | Bounded serial action runner with interaction IDs and request/error timestamps |
| Source/data tracing | Build explicit manifest; report unknown links, no guessed files or line mappings |
| Development reads | Independently test repository/read/search credentials and responses |
| Full release audit | Persistent page/device/check definitions, evidence retention, CI artifacts and deployment SHA binding |

## Release gates

Do not merge on local tests alone. Require exact-head CI, Preview, live mobile/desktop checks, scope-denial and request-blocking tests. Keep this PR Draft until the missing priority acceptance criteria are implemented. No Production settings or data have been changed. Browser sessions contain no authenticated customer cookies and are closed in finally blocks. Current URL policy is inherited from V2; review ownership verification of Preview aliases before broadening any host access.
