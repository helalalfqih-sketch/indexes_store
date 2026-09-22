/* eslint-disable prettier/prettier */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createStoreAdminAdapter, type StoreAdminAdapter } from "./store-admin.server";
import {
  createStoreDevelopmentAdapter,
  type StoreDevelopmentAdapter,
} from "./store-development.server";
import { createStoreInspectionAdapter, type StoreInspectionAdapter } from "./store-inspection.server";
import {
  createStoreBrowserInspectionAdapter,
  type StoreBrowserInspectionAdapter,
} from "./store-browser-inspection.server";
import {
  STORE_MCP_AUDIENCE,
  STORE_MCP_DISCOVERY_VERSION,
  STORE_MCP_SCOPE,
  verifyStoreAccessToken,
} from "./store-oauth.server";

const RESOURCE_METADATA = `${STORE_MCP_AUDIENCE.replace(
  "/api/mcp/store",
  "",
)}/.well-known/oauth-protected-resource/api/mcp/store`;
const HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "X-Content-Type-Options": "nosniff",
  "MCP-Server-Version": STORE_MCP_DISCOVERY_VERSION,
};
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const securitySchemes = [{ type: "oauth2", scopes: ["store.read"] }];
const developmentSecuritySchemes = [{ type: "oauth2", scopes: ["store.develop"] }];
const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

type Authorization = { sub: string; tenantId: string; scopes: string[] };
type Authorize = (token: string) => Authorization;
type AdapterFactory = (tenantId: string) => StoreAdminAdapter;
type DevelopmentAdapterFactory = () => StoreDevelopmentAdapter;
type InspectionAdapterFactory = () => StoreInspectionAdapter;
type BrowserInspectionAdapterFactory = () => StoreBrowserInspectionAdapter;

function bearer(request: Request, authorize: Authorize): Authorization | null {
  const match = /^Bearer (.+)$/.exec(request.headers.get("authorization") || "");
  if (!match || match[1].length > 8192) return null;
  try {
    return authorize(match[1]);
  } catch {
    return null;
  }
}

function result(data: Record<string, unknown>) {
  return {
    structuredContent: data,
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

async function safeRead(read: () => Promise<Record<string, unknown>>) {
  try {
    return result(await read());
  } catch {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "Store data is temporarily unavailable. No result was inferred or fabricated.",
        },
      ],
    };
  }
}

function createServer(
  adapter: StoreAdminAdapter,
  development: StoreDevelopmentAdapter,
  inspection: StoreInspectionAdapter,
  browserInspection: StoreBrowserInspectionAdapter,
  scopes: string[],
) {
  const server = new McpServer(
    { name: "indexes-store-control-plane", version: STORE_MCP_DISCOVERY_VERSION },
    {
      instructions:
        "Private, tenant-bound Store administration plus guarded source development. Store data remains read-only. Source writes are restricted to agent/* branches and draft pull requests; direct main writes, merge, deploy, migrations, shell execution, and secret reads are forbidden.",
    },
  );
  const tool = <T extends z.ZodRawShape>(
    name: string,
    title: string,
    description: string,
    inputSchema: z.ZodObject<T>,
    read: (input: z.infer<z.ZodObject<T>>) => Promise<Record<string, unknown>>,
  ) =>
    server.registerTool(
      name,
      { title, description, inputSchema, annotations, _meta: { securitySchemes } },
      (input) => safeRead(() => read(input)),
    );

  tool(
    "store_health",
    "Inspect store health",
    "Read tenant, database, catalog integration, and record-count health without exposing credentials.",
    z.object({}).strict(),
    () => adapter.health(),
  );
  tool(
    "search_products",
    "Search products",
    "Search the tenant-scoped operational catalog. Returns exact product IDs for follow-up reads.",
    z
      .object({
        query: z.string().trim().max(120).default(""),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .strict(),
    ({ query, limit }) => adapter.searchProducts(query, limit),
  );
  tool(
    "get_product",
    "Read one product",
    "Read one exact tenant-scoped product by UUID. Does not accept a name or cross-tenant override.",
    z.object({ product_id: z.string().uuid() }).strict(),
    ({ product_id }) => adapter.getProduct(product_id),
  );
  tool(
    "inspect_catalog",
    "Inspect catalog quality",
    "Detect zero prices, missing descriptions or images, and duplicate SKU or slug values.",
    z.object({}).strict(),
    () => adapter.inspectCatalog(),
  );
  tool(
    "inspect_inventory",
    "Inspect inventory",
    "Read low and out-of-stock products from the tenant-scoped operational inventory.",
    z.object({ low_stock_threshold: z.number().int().min(0).max(10000).default(5) }).strict(),
    ({ low_stock_threshold }) => adapter.inspectInventory(low_stock_threshold),
  );
  tool(
    "inspect_orders",
    "Inspect recent orders",
    "Read recent order states and totals without customer names, phone numbers, addresses, notes, or email.",
    z.object({ limit: z.number().int().min(1).max(100).default(20) }).strict(),
    ({ limit }) => adapter.inspectOrders(limit),
  );
  tool(
    "inspect_pages",
    "Inspect store pages",
    "Read CMS page publication and SEO metadata without returning page body content.",
    z.object({}).strict(),
    () => adapter.inspectPages(),
  );
  tool(
    "inspect_runtime_errors",
    "Inspect runtime incidents",
    "Read recent tenant-scoped runtime incident summaries without stack traces or request context.",
    z.object({ limit: z.number().int().min(1).max(100).default(20) }).strict(),
    ({ limit }) => adapter.inspectRuntimeErrors(limit),
  );
  tool(
    "audit_log",
    "Read store audit log",
    "Read recent tenant-scoped change events. Actor email addresses are masked.",
    z.object({ limit: z.number().int().min(1).max(100).default(20) }).strict(),
    ({ limit }) => adapter.auditLog(limit),
  );
  const requireDevelopmentScope = async (
    action: () => Promise<Record<string, unknown>>,
  ) => {
    if (!scopes.includes("store.develop")) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: "Missing required OAuth scope: store.develop" }],
      };
    }
    return safeRead(action);
  };

  const developmentRead = <T extends z.ZodRawShape>(
    name: string,
    title: string,
    description: string,
    inputSchema: z.ZodObject<T>,
    read: (input: z.infer<z.ZodObject<T>>) => Promise<Record<string, unknown>>,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema,
        annotations,
        _meta: { securitySchemes: developmentSecuritySchemes },
      },
      (input) => requireDevelopmentScope(() => read(input)),
    );

  const developmentWrite = <T extends z.ZodRawShape>(
    name: string,
    title: string,
    description: string,
    inputSchema: z.ZodObject<T>,
    write: (input: z.infer<z.ZodObject<T>>) => Promise<Record<string, unknown>>,
  ) =>
    server.registerTool(
      name,
      {
        title,
        description,
        inputSchema,
        annotations: writeAnnotations,
        _meta: { securitySchemes: developmentSecuritySchemes },
      },
      (input) => requireDevelopmentScope(() => write(input)),
    );

  tool(
    "inspect_site",
    "Inspect Store site",
    "Crawl up to 25 same-origin Store pages and report HTTP, title, heading, and image-alt signals. Read-only.",
    z
      .object({
        start_url: z.string().url().default("https://indexes-store.vercel.app/"),
        limit: z.number().int().min(1).max(25).default(10),
      })
      .strict(),
    ({ start_url, limit }) => inspection.inspectSite(start_url, limit),
  );
  tool(
    "inspect_page",
    "Inspect Store page",
    "Read one Store page HTML and enumerate links, buttons, forms, controls, headings, SEO, and basic accessibility signals without changing the site.",
    z.object({ url: z.string().url().default("https://indexes-store.vercel.app/") }).strict(),
    ({ url }) => inspection.inspectPage(url),
  );
  tool(
    "inspect_navigation",
    "Inspect Store navigation",
    "Enumerate page links and resolved destinations for navigation analysis. Read-only.",
    z.object({ url: z.string().url().default("https://indexes-store.vercel.app/") }).strict(),
    ({ url }) => inspection.inspectNavigation(url),
  );
  tool(
    "inspect_forms",
    "Inspect Store forms",
    "Inspect forms and controls for missing names or accessible labels. Does not submit forms.",
    z.object({ url: z.string().url().default("https://indexes-store.vercel.app/") }).strict(),
    ({ url }) => inspection.inspectForms(url),
  );
  tool(
    "inspect_mobile_ui",
    "Inspect Store mobile signals",
    "Inspect responsive viewport metadata and report whether browser-rendered mobile testing is still required.",
    z.object({ url: z.string().url().default("https://indexes-store.vercel.app/") }).strict(),
    ({ url }) => inspection.inspectMobileUi(url),
  );

  tool(
    "inspect_rendered_page",
    "Inspect rendered Store page",
    "Launch a headless browser and inspect the rendered interactive DOM at desktop or mobile size. Read-only: no form submission or mutation.",
    z
      .object({
        url: z.string().url().default("https://indexes-store.vercel.app/"),
        device: z.enum(["desktop", "mobile"]).default("desktop"),
      })
      .strict(),
    ({ url, device }) => browserInspection.inspectRenderedPage(url, device),
  );
  tool(
    "inspect_console",
    "Inspect Store browser console",
    "Load a Store page in a headless browser and capture console errors and page errors. Read-only.",
    z.object({ url: z.string().url().default("https://indexes-store.vercel.app/") }).strict(),
    ({ url }) => browserInspection.inspectConsole(url),
  );
  tool(
    "inspect_network",
    "Inspect Store browser network",
    "Load a Store page and report failed requests and HTTP responses >=400 without returning credentials, request bodies, or headers.",
    z.object({ url: z.string().url().default("https://indexes-store.vercel.app/") }).strict(),
    ({ url }) => browserInspection.inspectNetwork(url),
  );
  tool(
    "inspect_screenshot",
    "Inspect Store screenshot",
    "Render a full-page desktop or mobile screenshot and return size/hash metadata. No site mutation is performed.",
    z
      .object({
        url: z.string().url().default("https://indexes-store.vercel.app/"),
        device: z.enum(["desktop", "mobile"]).default("desktop"),
      })
      .strict(),
    ({ url, device }) => browserInspection.screenshot(url, device),
  );

  tool(
    "trial_navigation",
    "Trial safe Store navigation",
    "Click one same-origin link by exact href or accessible text and report the resulting URL. Does not submit forms or click buttons.",
    z
      .object({
        url: z.string().url().default("https://indexes-store.vercel.app/"),
        href: z.string().trim().min(1).max(240).optional(),
        text: z.string().trim().min(1).max(120).optional(),
      })
      .strict(),
    ({ url, href, text }) => browserInspection.trialNavigation({ url, href, text }),
  );
  tool(
    "compare_preview",
    "Compare Production and Vercel Preview",
    "Render an allowlisted Production page and an indexes-store Vercel Preview page at the same viewport and compare title, interactive-element count, and screenshot hash.",
    z
      .object({
        production_url: z.string().url(),
        preview_url: z.string().url(),
        device: z.enum(["desktop", "mobile"]).default("desktop"),
      })
      .strict(),
    ({ production_url, preview_url, device }) =>
      browserInspection.comparePages({
        productionUrl: production_url,
        previewUrl: preview_url,
        device,
      }),
  );

  tool(
    "try_safe_click",
    "Try safe Store click",
    "Click one explicitly selected Store element only when it is outside forms, is not a submit control, has no purchase/delete/send intent, and cannot leave the Store origin.",
    z
      .object({
        url: z.string().url().default("https://indexes-store.vercel.app/"),
        selector: z.string().trim().min(1).max(200),
        device: z.enum(["desktop", "mobile"]).default("desktop"),
      })
      .strict(),
    ({ url, selector, device }) => browserInspection.safeClick({ url, selector, device }),
  );

  developmentRead(
    "development_repository",
    "Inspect Store source repository",
    "Read the fixed Indexes Store repository identity and development safety mode. Never exposes credentials.",
    z.object({}).strict(),
    () => development.repositoryInfo(),
  );
  developmentRead(
    "read_source_file",
    "Read Store source file",
    "Read a UTF-8 source file from main or an agent/* branch. Secret-like paths and environment files are blocked.",
    z
      .object({ path: z.string().trim().min(1).max(240), ref: z.string().trim().default("main") })
      .strict(),
    ({ path, ref }) => development.readFile(path, ref),
  );
  developmentRead(
    "search_source_code",
    "Search Store source code",
    "Search the fixed Indexes Store GitHub repository for source references and components.",
    z.object({ query: z.string().trim().min(1).max(120) }).strict(),
    ({ query }) => development.searchCode(query),
  );
  developmentRead(
    "trace_element_to_source",
    "Trace Store element to source",
    "Use rendered element signals such as visible text, data-testid, href, or element id to rank likely React source files. Returns candidates, not a fabricated exact mapping.",
    z
      .object({
        text: z.string().trim().min(2).max(120).optional(),
        test_id: z.string().trim().min(2).max(120).optional(),
        href: z.string().trim().min(2).max(240).optional(),
        element_id: z.string().trim().min(2).max(120).optional(),
      })
      .strict(),
    ({ text, test_id, href, element_id }) =>
      development.traceElement({ text, testId: test_id, href, elementId: element_id }),
  );

  developmentRead(
    "inspect_development_pr",
    "Inspect Store development PR",
    "Read the open draft PR, changed-file summary, and GitHub check-run state for one agent/* branch. Does not merge or deploy.",
    z.object({ branch: z.string().trim().min(3).max(86) }).strict(),
    ({ branch }) => development.inspectPullRequest(branch),
  );

  developmentRead(
    "release_readiness",
    "Check Store release readiness",
    "Evaluate one exact agent/* branch and expected head SHA against GitHub checks, combined status, and clean mergeability. Advisory only; does not merge or deploy.",
    z
      .object({
        branch: z.string().trim().min(3).max(86),
        expected_head_sha: z.string().length(40),
      })
      .strict(),
    ({ branch, expected_head_sha }) =>
      development.releaseReadiness({ branch, expectedHeadSha: expected_head_sha }),
  );

  developmentRead(
    "verify_production_source",
    "Verify Store production source",
    "Read main branch SHA and its GitHub checks/status after a release. This is source verification only and does not deploy or roll back.",
    z.object({}).strict(),
    () => development.inspectProduction(),
  );

  developmentWrite(
    "create_development_branch",
    "Create safe Store development branch",
    "Create an agent/* branch from main. Direct main writes are forbidden.",
    z
      .object({
        branch: z.string().trim().min(3).max(86),
        base: z.literal("main").default("main"),
        confirmed: z.literal(true),
      })
      .strict(),
    ({ branch, base }) => development.createBranch(branch, base),
  );
  developmentWrite(
    "patch_source_file",
    "Patch Store source file",
    "Replace one existing UTF-8 source file on an agent/* branch using an expected SHA guard. Direct main writes and secret-like paths are forbidden.",
    z
      .object({
        branch: z.string().trim().min(3).max(86),
        path: z.string().trim().min(1).max(240),
        expected_sha: z.string().trim().min(6).max(80),
        content: z.string().min(1).max(200000),
        message: z.string().trim().min(1).max(120),
        confirmed: z.literal(true),
      })
      .strict(),
    ({ branch, path, expected_sha, content, message }) =>
      development.patchFile({ branch, path, expectedSha: expected_sha, content, message }),
  );
  developmentWrite(
    "create_development_pr",
    "Create Store development pull request",
    "Open a draft PR from an agent/* branch into main. This does not merge or deploy.",
    z
      .object({
        branch: z.string().trim().min(3).max(86),
        title: z.string().trim().min(1).max(120),
        body: z.string().max(10000).default(""),
        confirmed: z.literal(true),
      })
      .strict(),
    ({ branch, title, body }) => development.createPullRequest({ branch, title, body }),
  );

  return server;
}

export async function handleStoreMcp(
  request: Request,
  options: {
    authorize?: Authorize;
    adapterFactory?: AdapterFactory;
    developmentAdapterFactory?: DevelopmentAdapterFactory;
    inspectionAdapterFactory?: InspectionAdapterFactory;
    browserInspectionAdapterFactory?: BrowserInspectionAdapterFactory;
  } = {},
) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...HEADERS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
      },
    });
  }

  const authorization = bearer(request, options.authorize ?? verifyStoreAccessToken);
  if (!authorization) {
    return Response.json(
      { error: "unauthorized" },
      {
        status: 401,
        headers: {
          ...HEADERS,
          "WWW-Authenticate": `Bearer resource_metadata="${RESOURCE_METADATA}", scope="${STORE_MCP_SCOPE}"`,
        },
      },
    );
  }
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...HEADERS, Allow: "POST, OPTIONS" } });
  }

  const adapter = (options.adapterFactory ?? createStoreAdminAdapter)(authorization.tenantId);
  const development = (options.developmentAdapterFactory ?? createStoreDevelopmentAdapter)();
  const inspection = (options.inspectionAdapterFactory ?? createStoreInspectionAdapter)();
  const browserInspection =
    (options.browserInspectionAdapterFactory ?? createStoreBrowserInspectionAdapter)();
  const server = createServer(adapter, development, inspection, browserInspection, authorization.scopes);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    const body = response.body ? await response.text() : null;
    const headers = new Headers(response.headers);
    Object.entries(HEADERS).forEach(([key, value]) => headers.set(key, value));
    return new Response(body, { status: response.status, headers });
  } finally {
    await server.close();
  }
}
