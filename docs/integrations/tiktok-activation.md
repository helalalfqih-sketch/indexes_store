# TikTok activation and remaining work

## Existing implementation

`src/lib/mcp/store-handler.server.ts` registers 14 TikTok tools covering account
inspection, capability inspection, profile inspection, own-video listing/search/query,
creator settings, draft upload, direct publication, publish status, link, refresh,
and local disconnect. Search scans at most 100 recent videos of the linked account.
It is not global TikTok search. Published-post editing/deletion is not implemented.

Two independent permission layers must be enabled:

| Operation                      | Connector OAuth | TikTok provider scope               |
| ------------------------------ | --------------- | ----------------------------------- |
| Profile                        | tiktok.read     | user.info.basic                     |
| Profile details / stats        | tiktok.read     | user.info.profile / user.info.stats |
| Own videos and search          | tiktok.read     | video.list                          |
| Draft upload                   | tiktok.publish  | video.upload                        |
| Direct post / creator settings | tiktok.publish  | video.publish                       |
| Link / refresh / disconnect    | tiktok.manage   | depends on account grants           |

The connector must reconnect/authorize the required scopes and refresh its tool
catalog if TikTok tools do not appear. This cannot be fixed by adding duplicate tools.
Confirm actual granted connector scopes before attributing the missing tools to a cause.

After TikTok approves the relevant products/scopes, set `TIKTOK_OAUTH_SCOPES` to the
approved subset. Include `video.publish` only when approved; it is not in the default
scope set. Reauthorize each account to obtain new scopes. Token refresh alone does
not grant new permissions. Never expose provider secrets to the connector or browser.

## Release blockers / limitations

- Provider approval, actual granted scopes and live calls are not verified by this PR.
- Scope booleans are eligibility hints, not proof of working API calls.
- Direct Post audit rules exclude tools limited to internal/team account management;
  assess intended-use eligibility or use an approved provider before committing to this route.
- Public publication requires appropriate TikTok review; unaudited clients are restricted.
- PULL_FROM_URL requires a TikTok-verified owned domain or URL prefix.
- A complete publishing UI still needs preview, creator identity, explicit privacy selection,
  duration validation, commercial-content disclosures, music confirmation and progress.
- This PR validates live privacy/interaction settings, but does not implement all those UI requirements.
- A successful initialization is not a published post. Read publish status for final outcome.
- Global product-video discovery needs a separately verified search provider or browser workflow.
- Editing existing TikTok posts must use a verified supported provider/platform workflow;
  do not invent an edit endpoint or replace editing with delete/repost.

## Validation after approval

1. Reconnect the MCP connector and confirm TikTok tools appear.
2. Inspect the two linked accounts and provider scope gaps without reading secrets.
3. Reauthorize approved scopes and read profile, video list and an exact video.
4. Verify own-video search is labeled accurately.
5. Only with an explicitly approved video/account, initialize upload then inspect final status.
6. Keep public publication blocked until review and full publishing UX are verified.

## Official references (checked 2026-10-01)

- https://developers.tiktok.com/docs/en/tiktok-api-v2-video-list
- https://developers.tiktok.com/docs/en/content-posting-api-get-started
- https://developers.tiktok.com/docs/en/content-posting-api-reference-query-creator-info
- https://developers.tiktok.com/docs/en/content-sharing-guidelines
