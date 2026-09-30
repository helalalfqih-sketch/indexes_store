/* eslint-disable prettier/prettier */
import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { handleStoreMcp } from "@/lib/mcp/store-handler.server";
import type { StoreAdminAdapter } from "@/lib/mcp/store-admin.server";
import type { StoreDevelopmentAdapter } from "@/lib/mcp/store-development.server";
import type { StoreInspectionAdapter } from "@/lib/mcp/store-inspection.server";
import type { StoreBrowserInspectionAdapter } from "@/lib/mcp/store-browser-inspection.server";
import type { TikTokMcpAdapter } from "@/lib/mcp/tiktok-adapter.server";

function fixture(): StoreAdminAdapter {
  return {
    health: vi.fn(async () => ({ mode: "read-only", tenant: { id: "tenant-a" } })),
    searchProducts: vi.fn(async () => ({ products: [] })),
    getProduct: vi.fn(async () => ({ found: false, product: null })),
    inspectCatalog: vi.fn(async () => ({ issues: [] })),
    inspectInventory: vi.fn(async () => ({ products: [] })),
    inspectOrders: vi.fn(async () => ({ orders: [], piiIncluded: false })),
    inspectPages: vi.fn(async () => ({ pages: [] })),
    inspectRuntimeErrors: vi.fn(async () => ({ incidents: [] })),
    auditLog: vi.fn(async () => ({ entries: [] })),
  };
}

function developmentFixture(): StoreDevelopmentAdapter {
  return {
    repositoryInfo: vi.fn(async () => ({ repository: "helalalfqih-sketch/indexes_store" })),
    readFile: vi.fn(async () => ({ path: "src/app.tsx", sha: "abc", content: "export {};" })),
    searchCode: vi.fn(async () => ({ results: [] })),
    createBranch: vi.fn(async () => ({ branch: "agent/test-change", base: "main" })),
    patchFile: vi.fn(async () => ({ commitSha: "commit-a" })),
    createPullRequest: vi.fn(async () => ({ number: 125, draft: true })),
    traceElement: vi.fn(async () => ({ candidates: [] })),
    inspectPullRequest: vi.fn(async () => ({ found: false })),
    releaseReadiness: vi.fn(async () => ({
      ready: false,
      blockers: ["CHECKS_NOT_COMPLETE"],
    })),
    inspectProduction: vi.fn(async () => ({
      headSha: "a".repeat(40),
      combinedStatus: "success",
    })),
  };
}

function inspectionFixture(): StoreInspectionAdapter {
  return {
    inspectPage: vi.fn(async () => ({ status: 200, interactiveElements: [] })),
    inspectNavigation: vi.fn(async () => ({ links: [] })),
    inspectForms: vi.fn(async () => ({ forms: [], controls: [] })),
    inspectMobileUi: vi.fn(async () => ({ hasResponsiveViewport: true })),
    inspectSite: vi.fn(async () => ({ pages: [] })),
  };
}

function browserInspectionFixture(): StoreBrowserInspectionAdapter {
  return {
    inspectRenderedPage: vi.fn(async () => ({ elements: [], inspectionMode: "rendered-read-only" })),
    inspectConsole: vi.fn(async () => ({ errors: [], events: [] })),
    inspectNetwork: vi.fn(async () => ({ failedRequests: [], badResponses: [] })),
    screenshot: vi.fn(async () => ({ mimeType: "image/png", bytes: 1, sha256: "abc" })),
    safeClick: vi.fn(async () => ({ inspectionMode: "safe-click-read-only" })),
    trialNavigation: vi.fn(async () => ({ found: true, finalUrl: "https://indexes-store.vercel.app/" })),
    comparePages: vi.fn(async () => ({ changed: false })),
  };
}

function tiktokFixture(): TikTokMcpAdapter {
  return {
    listAccounts: vi.fn(async () => ({ accounts: [], secret_fields_included: false })),
    getAccount: vi.fn(async () => ({ found: false, account: null, secret_fields_included: false })),
    inspectCapabilities: vi.fn(async () => ({ capabilities: {}, provider_scopes: [] })),
    inspectProfile: vi.fn(async () => ({ user: {}, requested_fields: [] })),
    listVideos: vi.fn(async () => ({ videos: [], cursor: null, has_more: false })),
    searchVideos: vi.fn(async () => ({ videos: [], count: 0, pages_scanned: 1 })),
    getVideo: vi.fn(async () => ({ found: false, video: null })),
    creatorInfo: vi.fn(async () => ({ creator_info: {} })),
    uploadVideoDraft: vi.fn(async () => ({ accepted: true, publish_id: "draft-1" })),
    publishVideo: vi.fn(async () => ({ accepted: true, publish_id: "publish-1" })),
    publishStatus: vi.fn(async () => ({ publish_id: "publish-1", status: {} })),
    startLink: vi.fn(async () => ({
      device_url: "https://indexes-store.vercel.app/api/tiktok/device?code=opaque-test-code",
      expires_in_seconds: 300,
      contains_provider_secret: false,
    })),
    refreshAccount: vi.fn(async () => ({ ok: true })),
    disconnectAccount: vi.fn(async () => ({
      ok: true,
      local_tokens_deleted: true,
      provider_authorization_revoked: false,
    })),
  };
}

async function connected(scopes = ["store.read", "store.develop"]) {
  const adapter = fixture();
  const development = developmentFixture();
  const browserInspection = browserInspectionFixture();
  const tiktok = tiktokFixture();
  const client = new Client({ name: "store-mcp-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("https://indexes-store.vercel.app/api/mcp/store"),
    {
      requestInit: { headers: { Authorization: "Bearer test" } },
      fetch: (url, init) =>
        handleStoreMcp(new Request(url, init), {
          authorize: () => ({ sub: "admin", tenantId: "tenant-a", scopes }),
          adapterFactory: (tenantId) => {
            expect(tenantId).toBe("tenant-a");
            return adapter;
          },
          developmentAdapterFactory: () => development,
          inspectionAdapterFactory: () => inspectionFixture(),
          browserInspectionAdapterFactory: () => browserInspection,
          tiktokAdapterFactory: (tenantId, userId) => {
            expect(tenantId).toBe("tenant-a");
            expect(userId).toBe("admin");
            return tiktok;
          },
        }),
    },
  );
  await client.connect(transport);
  return { client, adapter, development, browserInspection, tiktok };
}

describe("private store MCP", () => {
  it.each([
    { name: "try_safe_click", arguments: { selector: 'button[aria-label="test"]' }, required: "store.test", scopes: ["store.read", "store.develop", "offline_access"], requested: "store.read store.test store.develop offline_access" },
    { name: "trial_navigation", arguments: { href: "/offers" }, required: "store.test", scopes: ["store.read"], requested: "store.read store.test" },
    { name: "development_repository", arguments: {}, required: "store.develop", scopes: ["store.read", "store.test"], requested: "store.read store.test store.develop" },
    { name: "create_development_branch", arguments: { branch: "agent/scope-test", confirmed: true }, required: "store.develop", scopes: ["store.read"], requested: "store.read store.develop" },
    { name: "tiktok_list_accounts", arguments: {}, required: "tiktok.read", scopes: ["store.read"], requested: "store.read tiktok.read" },
    { name: "tiktok_start_link", arguments: {}, required: "tiktok.manage", scopes: ["store.read", "tiktok.read"], requested: "store.read tiktok.read tiktok.manage" },
    { name: "tiktok_publish_video", arguments: { account_id: "00000000-0000-4000-8000-000000000001", video_url: "https://indexes-store.vercel.app/video.mp4", privacy_level: "SELF_ONLY", confirmed: true }, required: "tiktok.publish", scopes: ["store.read", "tiktok.read", "tiktok.manage"], requested: "store.read tiktok.read tiktok.manage tiktok.publish" },
  ])("challenges for missing OAuth scope before $name executes", async ({ name, arguments: args, required, scopes, requested }) => {
    const originalScopes = [...scopes];
    const { client, adapter, development, browserInspection, tiktok } = await connected(scopes);
    try {
      const response = await client.callTool({ name, arguments: args });
      expect(response.isError).toBe(true);
      expect(response.structuredContent).toEqual({ error: "INSUFFICIENT_SCOPE", required_scopes: ["store.read", required] });
      expect(response._meta?.["mcp/www_authenticate"]).toEqual([
        `Bearer resource_metadata="https://indexes-store.vercel.app/.well-known/oauth-protected-resource/api/mcp/store", error="insufficient_scope", error_description="Additional consent is required for ${required}", scope="${requested}"`,
      ]);
      expect(browserInspection.safeClick).not.toHaveBeenCalled();
      expect(browserInspection.trialNavigation).not.toHaveBeenCalled();
      expect(development.repositoryInfo).not.toHaveBeenCalled();
      expect(development.createBranch).not.toHaveBeenCalled();
      expect(tiktok.listAccounts).not.toHaveBeenCalled();
      expect(tiktok.startLink).not.toHaveBeenCalled();
      // Asking for consent never changes the current grant or blocks read tools.
      expect(scopes).toEqual(originalScopes);
      expect((await client.callTool({ name, arguments: args })).isError).toBe(true);
      expect((await client.callTool({ name: "store_health", arguments: {} })).isError).not.toBe(true);
      expect(adapter.health).toHaveBeenCalledOnce();
    } finally {
      await client.close();
    }
  });

  it("runs a test tool without an OAuth challenge when its scope is granted", async () => {
    const { client, browserInspection } = await connected(["store.read", "store.test"]);
    try {
      const { tools } = await client.listTools();
      for (const name of ["try_safe_click", "trial_navigation"]) {
        expect(tools.find((tool) => tool.name === name)?._meta?.securitySchemes).toEqual([
          { type: "oauth2", scopes: ["store.read", "store.test"] },
        ]);
      }
      const response = await client.callTool({ name: "try_safe_click", arguments: { selector: 'button[aria-label="test"]' } });
      expect(response.isError).not.toBe(true);
      expect(response._meta?.["mcp/www_authenticate"]).toBeUndefined();
      expect(browserInspection.safeClick).toHaveBeenCalledOnce();
    } finally {
      await client.close();
    }
  });

  it("exposes only tenant-bound read tools", async () => {
    const { client } = await connected();
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(
        [
          "audit_log",
          "inspect_ui_tree",
          "inspect_product_grid",
          "inspect_filter_state",
          "full_store_audit",
          "get_product",
          "inspect_catalog",
          "inspect_inventory",
          "inspect_orders",
          "inspect_pages",
          "inspect_runtime_errors",
          "search_products",
          "store_health",
          "development_repository",
          "read_source_file",
          "search_source_code",
          "trace_element_to_source",
          "inspect_development_pr",
          "release_readiness",
          "verify_production_source",
          "create_development_branch",
          "patch_source_file",
          "create_development_pr",
          "inspect_site",
          "inspect_page",
          "inspect_navigation",
          "inspect_forms",
          "inspect_mobile_ui",
          "inspect_rendered_page",
          "inspect_console",
          "inspect_network",
          "inspect_screenshot",
          "try_safe_click",
          "trial_navigation",
          "compare_preview",
          "tiktok_list_accounts",
          "tiktok_get_account",
          "tiktok_inspect_capabilities",
          "tiktok_inspect_profile",
          "tiktok_list_videos",
          "tiktok_search_videos",
          "tiktok_get_video",
          "tiktok_creator_info",
          "tiktok_upload_video_draft",
          "tiktok_publish_video",
          "tiktok_publish_status",
          "tiktok_start_link",
          "tiktok_refresh_account",
          "tiktok_disconnect_account",
        ].sort(),
      );
      const byName = new Map(tools.map((tool) => [tool.name, tool]));
      expect((await client.callTool({name:"try_safe_click",arguments:{selector:'button[aria-label="test"]'}})).isError).toBe(true);
      expect(byName.get("store_health")?.annotations?.readOnlyHint).toBe(true);
      expect(byName.get("read_source_file")?.annotations?.readOnlyHint).toBe(true);
      expect(byName.get("patch_source_file")?.annotations?.readOnlyHint).toBe(false);
      expect(byName.get("patch_source_file")?.annotations?.destructiveHint).toBe(false);
      expect(byName.get("tiktok_list_accounts")?.annotations?.readOnlyHint).toBe(true);
      expect(byName.get("tiktok_search_videos")?.annotations?.readOnlyHint).toBe(true);
      expect(byName.get("tiktok_publish_video")?.annotations?.readOnlyHint).toBe(false);
      expect(byName.get("tiktok_publish_video")?.annotations?.destructiveHint).toBe(false);
      expect(byName.get("tiktok_start_link")?.annotations?.readOnlyHint).toBe(false);
      expect(byName.get("tiktok_start_link")?.annotations?.destructiveHint).toBe(false);
      expect(byName.get("tiktok_disconnect_account")?.annotations?.destructiveHint).toBe(true);
      expect((await client.callTool({ name: "update_product", arguments: {} })).isError).toBe(true);
    } finally {
      await client.close();
    }
  });

  it("runs all TikTok MCP account tools when their OAuth scopes are granted", async () => {
    const { client, tiktok } = await connected([
      "store.read",
      "tiktok.read",
      "tiktok.manage",
      "tiktok.publish",
    ]);
    const accountId = "00000000-0000-4000-8000-000000000001";
    try {
      const { tools } = await client.listTools();
      const byName = new Map(tools.map((tool) => [tool.name, tool]));
      expect(byName.get("tiktok_list_accounts")?._meta?.securitySchemes).toEqual([
        { type: "oauth2", scopes: ["store.read", "tiktok.read"] },
      ]);
      expect(byName.get("tiktok_start_link")?._meta?.securitySchemes).toEqual([
        { type: "oauth2", scopes: ["store.read", "tiktok.manage"] },
      ]);
      expect(byName.get("tiktok_publish_video")?._meta?.securitySchemes).toEqual([
        { type: "oauth2", scopes: ["store.read", "tiktok.publish"] },
      ]);

      expect((await client.callTool({ name: "tiktok_list_accounts", arguments: {} })).isError).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_get_account", arguments: { account_id: accountId } }))
          .isError,
      ).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_inspect_capabilities", arguments: { account_id: accountId } })).isError,
      ).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_inspect_profile", arguments: { account_id: accountId } })).isError,
      ).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_list_videos", arguments: { account_id: accountId } })).isError,
      ).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_search_videos", arguments: { account_id: accountId, query: "product" } })).isError,
      ).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_get_video", arguments: { account_id: accountId, video_id: "video-1" } })).isError,
      ).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_creator_info", arguments: { account_id: accountId } })).isError,
      ).not.toBe(true);
      expect(
        (
          await client.callTool({
            name: "tiktok_upload_video_draft",
            arguments: {
              account_id: accountId,
              video_url: "https://indexes-store.vercel.app/video.mp4",
              confirmed: true,
            },
          })
        ).isError,
      ).not.toBe(true);
      expect(
        (
          await client.callTool({
            name: "tiktok_publish_video",
            arguments: {
              account_id: accountId,
              video_url: "https://indexes-store.vercel.app/video.mp4",
              title: "Product",
              privacy_level: "SELF_ONLY",
              confirmed: true,
            },
          })
        ).isError,
      ).not.toBe(true);
      expect(
        (
          await client.callTool({
            name: "tiktok_publish_status",
            arguments: { account_id: accountId, publish_id: "publish-1" },
          })
        ).isError,
      ).not.toBe(true);
      expect((await client.callTool({ name: "tiktok_start_link", arguments: {} })).isError).not.toBe(true);
      expect(
        (await client.callTool({ name: "tiktok_refresh_account", arguments: { account_id: accountId } }))
          .isError,
      ).not.toBe(true);
      expect(
        (
          await client.callTool({
            name: "tiktok_disconnect_account",
            arguments: { account_id: accountId, confirmed: true },
          })
        ).isError,
      ).not.toBe(true);

      expect(tiktok.listAccounts).toHaveBeenCalledOnce();
      expect(tiktok.getAccount).toHaveBeenCalledWith(accountId);
      expect(tiktok.inspectCapabilities).toHaveBeenCalledWith(accountId);
      expect(tiktok.inspectProfile).toHaveBeenCalledWith(accountId);
      expect(tiktok.listVideos).toHaveBeenCalledWith(accountId, 20, undefined);
      expect(tiktok.searchVideos).toHaveBeenCalledWith(accountId, "product", 20);
      expect(tiktok.getVideo).toHaveBeenCalledWith(accountId, "video-1");
      expect(tiktok.creatorInfo).toHaveBeenCalledWith(accountId);
      expect(tiktok.uploadVideoDraft).toHaveBeenCalledWith(
        accountId,
        "https://indexes-store.vercel.app/video.mp4",
      );
      expect(tiktok.publishVideo).toHaveBeenCalledWith(accountId, {
        videoUrl: "https://indexes-store.vercel.app/video.mp4",
        title: "Product",
        privacyLevel: "SELF_ONLY",
        disableComment: false,
        disableDuet: false,
        disableStitch: false,
        videoCoverTimestampMs: undefined,
      });
      expect(tiktok.publishStatus).toHaveBeenCalledWith(accountId, "publish-1");
      expect(tiktok.startLink).toHaveBeenCalledOnce();
      expect(tiktok.refreshAccount).toHaveBeenCalledWith(accountId);
      expect(tiktok.disconnectAccount).toHaveBeenCalledWith(accountId);
    } finally {
      await client.close();
    }
  });

  it("blocks development tools when store.develop is absent", async () => {
    const adapter = fixture();
    const development = developmentFixture();
    const client = new Client({ name: "store-mcp-read-only-test", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(
      new URL("https://indexes-store.vercel.app/api/mcp/store"),
      {
        requestInit: { headers: { Authorization: "Bearer test" } },
        fetch: (url, init) =>
          handleStoreMcp(new Request(url, init), {
            authorize: () => ({ sub: "admin", tenantId: "tenant-a", scopes: ["store.read"] }),
            adapterFactory: () => adapter,
            developmentAdapterFactory: () => development,
            inspectionAdapterFactory: () => inspectionFixture(),
            browserInspectionAdapterFactory: () => browserInspectionFixture(),
            tiktokAdapterFactory: () => tiktokFixture(),
          }),
      },
    );
    await client.connect(transport);
    try {
      const response = await client.callTool({
        name: "development_repository",
        arguments: {},
      });
      expect(response.isError).toBe(true);
      expect(development.repositoryInfo).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });

  it("does not allow a caller-supplied tenant override", async () => {
    const { client, adapter } = await connected();
    try {
      const response = await client.callTool({
        name: "search_products",
        arguments: { query: "هاتف", tenant_id: "tenant-b" },
      });
      expect(response.isError).toBe(true);
      expect(adapter.searchProducts).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });

  it("rejects requests without OAuth before constructing an adapter", async () => {
    const adapterFactory = vi.fn(() => fixture());
    const response = await handleStoreMcp(
      new Request("https://indexes-store.vercel.app/api/mcp/store", { method: "POST" }),
      { adapterFactory },
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toContain("oauth-protected-resource");
    expect(adapterFactory).not.toHaveBeenCalled();
  });
});
