import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { handleStoreMcp } from "../../src/lib/mcp/store-handler.server";
import { inspectQa, fullStoreAudit } from "../../src/lib/mcp/store-qa.server";
import {
  createStoreBrowserInspectionAdapter,
  type withPage,
} from "../../src/lib/mcp/store-browser-inspection.server";
import {
  registerStoreClient,
  issueStoreCode,
  exchangeStoreCode,
} from "../../src/lib/mcp/store-oauth.server";
import type { StoreAdminAdapter } from "../../src/lib/mcp/store-admin.server";
import type { StoreDevelopmentAdapter } from "../../src/lib/mcp/store-development.server";
import type { StoreInspectionAdapter } from "../../src/lib/mcp/store-inspection.server";

// No production credentials or data: the real browser serves only this intercepted fixture.
const html = `<!doctype html><html><head><title>Isolated Store QA</title></head><body>
<section id="catalog">
<div data-element-key="filters" data-qa-filter-state='{"category":"all","sort":"default","minPrice":null,"maxPrice":null}'></div>
<button type="button" data-element-key="filter-cheap" data-qa-action="local" aria-pressed="false"
onclick="this.setAttribute('aria-pressed','true');document.querySelector('[data-qa-filter-state]').setAttribute('data-qa-filter-state',JSON.stringify({category:'all',sort:'default',minPrice:0,maxPrice:20000}));document.getElementById('expensive').hidden=true;document.getElementById('filter-panel').hidden=false">Under 20000</button>
<button type="button" data-element-key="network-test" data-qa-action="local" onclick="Promise.allSettled([fetch('/orders',{method:'POST',body:'test'}),fetch('https://outside.invalid/read')])">Network probe</button>
<article data-element-key="card" data-storefront-product-id="p-cheap" data-product-name="Cheap" data-price-yer="19900" data-product-category="watches">Cheap</article>
<article id="expensive" data-element-key="card" data-storefront-product-id="p-expensive" data-product-name="Expensive" data-price-yer="59900">Expensive</article>
<div id="filter-panel" role="dialog" hidden>Filtered</div>
<form id="order-form"><button type="submit" data-element-key="submit" data-qa-action="local">Send</button></form>
<input type="password" value="never-expose-this" id="private-input">
</section></body></html>`;

function testToken(scope: string) {
  const redirectUri = "https://chatgpt.com/connector/oauth/isolated-v3-test";
  const clientId = registerStoreClient([redirectUri]);
  const verifier = "x".repeat(64);
  return exchangeStoreCode(
    issueStoreCode({
      sub: "fixture-admin",
      tenantId: "fixture-tenant",
      clientId,
      redirectUri,
      challenge: createHash("sha256").update(verifier).digest("base64url"),
      scope,
    }),
    clientId,
    redirectUri,
    verifier,
  ).accessToken;
}

test("V3 MCP tools return real Chromium evidence and enforce isolated interaction guards", async ({
  browser,
}) => {
  test.setTimeout(60_000);
  const previousSecret = process.env.STORE_MCP_OAUTH_SECRET;
  process.env.STORE_MCP_OAUTH_SECRET = "isolated-ci-v3-secret-never-used-on-production";
  let insertUnrelated = false;
  let contextsOpened = 0;
  let contextsClosed = 0;
  const browse: typeof withPage = async (url, viewport, run, beforeNavigate) => {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    contextsOpened++;
    try {
      await context.route("**/*", (route) =>
        route.fulfill({ status: 200, contentType: "text/html", body: html }),
      );
      const page = await context.newPage();
      beforeNavigate?.(page);
      await page.goto(url);
      if (insertUnrelated)
        await page
          .locator("body")
          .evaluate((el) =>
            el.insertAdjacentHTML("afterbegin", '<button id="unrelated">Unrelated</button>'),
          );
      return await run(page, browser);
    } finally {
      await context.close();
      contextsClosed++;
    }
  };
  const options = {
    adapterFactory: (tenantId: string) => {
      expect(tenantId).toBe("fixture-tenant");
      return {} as StoreAdminAdapter;
    },
    developmentAdapterFactory: () => ({}) as StoreDevelopmentAdapter,
    inspectionAdapterFactory: () => ({}) as StoreInspectionAdapter,
    browserInspectionAdapterFactory: () => createStoreBrowserInspectionAdapter(browse),
    qaAdapter: {
      inspect: ((url, device, mode) => inspectQa(url, device, mode, browse)) as typeof inspectQa,
      audit: ((url) => fullStoreAudit(url, browse)) as typeof fullStoreAudit,
    },
  };
  const clients: Client[] = [];
  async function connect(scope: string) {
    const client = new Client({ name: "isolated-v3-e2e", version: "1.0.0" });
    clients.push(client);
    await client.connect(
      new StreamableHTTPClientTransport(new URL("https://indexes-store.vercel.app/api/mcp/store"), {
        requestInit: { headers: { Authorization: `Bearer ${testToken(scope)}` } },
        fetch: (url, init) => handleStoreMcp(new Request(url, init), options),
      }),
    );
    return client;
  }
  try {
    const reader = await connect("store.read");
    const names = (await reader.listTools()).tools.map((tool) => tool.name);
    for (const name of [
      "inspect_ui_tree",
      "inspect_product_grid",
      "inspect_filter_state",
      "full_store_audit",
    ])
      expect(names).toContain(name);
    for (const device of ["desktop", "mobile"]) {
      const tree = await reader.callTool({ name: "inspect_ui_tree", arguments: { device } });
      expect(tree.isError).not.toBe(true);
      expect(JSON.stringify(tree)).not.toContain("never-expose-this");
      expect(tree.structuredContent).toMatchObject({
        device,
        viewport: { width: device === "mobile" ? 390 : 1440 },
        loaded_product_count: 2,
      });
      const grid = await reader.callTool({ name: "inspect_product_grid", arguments: { device } });
      expect(grid.structuredContent).toMatchObject({
        products: [
          { product_id: "p-cheap", price: 19900, stock: null, section: "catalog" },
          { product_id: "p-expensive", price: 59900 },
        ],
      });
      const filters = await reader.callTool({
        name: "inspect_filter_state",
        arguments: { device },
      });
      expect(filters.structuredContent).toMatchObject({
        status: "OBSERVED",
        filters: { category: "all", sort: "default" },
      });
    }
    const opened = contextsOpened;
    expect(
      (
        await reader.callTool({
          name: "try_safe_click",
          arguments: { element_key: "catalog:ui:filter-cheap" },
        })
      ).isError,
    ).toBe(true);
    expect(contextsOpened).toBe(opened);
    const tester = await connect("store.read store.test");
    insertUnrelated = true;
    const clicked = await tester.callTool({
      name: "try_safe_click",
      arguments: { element_key: "catalog:ui:filter-cheap", device: "mobile" },
    });
    expect(clicked.isError).not.toBe(true);
    expect(clicked.structuredContent).toMatchObject({
      outcome: "OBSERVED",
      before_state: { loaded_product_count: 2 },
      after_state: { loaded_product_count: 1, filters: { maxPrice: 20000 } },
      state_diff: { appeared: ["catalog:ui:filter-panel"] },
    });
    const blocked = await tester.callTool({
      name: "try_safe_click",
      arguments: { element_key: "catalog:ui:network-test" },
    });
    expect(blocked.structuredContent).toMatchObject({
      outcome: "BLOCKED",
      blocked_requests: expect.arrayContaining([
        { method: "POST", path: "/orders" },
        { method: "GET", path: "/read" },
      ]),
    });
    expect(
      (
        await tester.callTool({
          name: "try_safe_click",
          arguments: { element_key: "catalog:ui:submit" },
        })
      ).isError,
    ).toBe(true);
    const audit = await reader.callTool({ name: "full_store_audit", arguments: {} });
    expect(audit.isError).not.toBe(true);
    expect(audit.structuredContent).toMatchObject({ summary: { total: 90, NOT_TESTED: 40 } });
    expect(contextsClosed).toBe(contextsOpened);
  } finally {
    await Promise.all(clients.map((client) => client.close()));
    if (previousSecret === undefined) delete process.env.STORE_MCP_OAUTH_SECRET;
    else process.env.STORE_MCP_OAUTH_SECRET = previousSecret;
  }
});
