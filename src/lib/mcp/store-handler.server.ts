import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createStoreAdminAdapter, type StoreAdminAdapter } from "./store-admin.server";
import { STORE_MCP_AUDIENCE, STORE_MCP_SCOPE, verifyStoreAccessToken } from "./store-oauth.server";

const RESOURCE_METADATA = `${STORE_MCP_AUDIENCE.replace(
  "/api/mcp/store",
  "",
)}/.well-known/oauth-protected-resource/api/mcp/store`;
const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const securitySchemes = [{ type: "oauth2", scopes: ["store.read"] }];

type Authorization = { sub: string; tenantId: string };
type Authorize = (token: string) => Authorization;
type AdapterFactory = (tenantId: string) => StoreAdminAdapter;

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

function createServer(adapter: StoreAdminAdapter) {
  const server = new McpServer(
    { name: "indexes-store-admin", version: "1.0.0" },
    {
      instructions:
        "Private, tenant-bound, read-only administration for Indexes Store. Never infer missing prices, stock, order state, or deployment health. This server cannot write, publish, delete, migrate, deploy, or read secrets.",
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
  return server;
}

export async function handleStoreMcp(
  request: Request,
  options: {
    authorize?: Authorize;
    adapterFactory?: AdapterFactory;
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
  const server = createServer(adapter);
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
