/* eslint-disable prettier/prettier */
import { describe, expect, it, vi } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { handleStoreMcp } from "@/lib/mcp/store-handler.server";
import type { StoreAdminAdapter } from "@/lib/mcp/store-admin.server";
import type { StoreDevelopmentAdapter } from "@/lib/mcp/store-development.server";
import type { StoreInspectionAdapter } from "@/lib/mcp/store-inspection.server";
import type { StoreBrowserInspectionAdapter } from "@/lib/mcp/store-browser-inspection.server";

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
    releaseReadiness: vi.fn(async () => ({ ready: false, blockers: ["CHECKS_NOT_COMPLETE"] })),\n    inspectProduction: vi.fn(async () => ({ headSha: "a".repeat(40), combinedStatus: "success" })),
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

async function connected() {
  const adapter = fixture();
  const client = new Client({ name: "store-mcp-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("https://indexes-store.vercel.app/api/mcp/store"),
    {
      requestInit: { headers: { Authorization: "Bearer test" } },
      fetch: (url, init) =>
        handleStoreMcp(new Request(url, init), {
          authorize: () => ({ sub: "admin", tenantId: "tenant-a" }),
          adapterFactory: (tenantId) => {
            expect(tenantId).toBe("tenant-a");
            return adapter;
          },
          developmentAdapterFactory: () => developmentFixture(),
          inspectionAdapterFactory: () => inspectionFixture(),
          browserInspectionAdapterFactory: () => browserInspectionFixture(),
        }),
    },
  );
  await client.connect(transport);
  return { client, adapter };
}

describe("private store MCP", () => {
  it("exposes only tenant-bound read tools", async () => {
    const { client } = await connected();
    try {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual(
        [
          "audit_log",
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
          "release_readiness",\n          "verify_production_source",
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
        ].sort(),
      );
      const byName = new Map(tools.map((tool) => [tool.name, tool]));
      expect(byName.get("store_health")?.annotations?.readOnlyHint).toBe(true);
      expect(byName.get("read_source_file")?.annotations?.readOnlyHint).toBe(true);
      expect(byName.get("patch_source_file")?.annotations?.readOnlyHint).toBe(false);
      expect(byName.get("patch_source_file")?.annotations?.destructiveHint).toBe(false);
      expect((await client.callTool({ name: "update_product", arguments: {} })).isError).toBe(true);
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
