import { test } from "node:test";
import assert from "node:assert/strict";
import { createShopifyCatalog, shopifyProductModel } from "../shopify-catalog.mjs";
import worker from "../../.tmp/storefront/worker.mjs";

const info = (overrides = {}) => ({
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: "start",
  endCursor: "end",
  ...overrides,
});
const variant = (id, price, overrides = {}) => ({
  id: `gid://shopify/ProductVariant/${id}`,
  title: `خيار ${id}`,
  availableForSale: true,
  price: { amount: String(price), currencyCode: "YER" },
  compareAtPrice: null,
  image: { url: `https://cdn.shopify.com/${id}.jpg` },
  selectedOptions: [],
  quantityRule: { minimum: 1, maximum: null, increment: 1 },
  ...overrides,
});
const product = () => ({
  id: "gid://shopify/Product/1",
  title: "منتج حقيقي",
  handle: "real-product",
  description: "وصف\nالمنتج",
  availableForSale: true,
  featuredImage: { url: "https://cdn.shopify.com/1.jpg" },
  images: {
    nodes: [{ id: "image1", url: "https://cdn.shopify.com/1.jpg", altText: "الصورة" }],
    pageInfo: info(),
  },
  variants: { nodes: [variant(1, 14500), variant(2, 23500)], pageInfo: info() },
});

function source(options = {}) {
  const calls = [];
  let quotePrice = 23500,
    quoteAvailable = true;
  const fetcher = async (url, init) => {
    assert.equal(url, "https://indexesstore.myshopify.com/api/2026-10/graphql.json");
    const operation = JSON.parse(init.body);
    calls.push(operation);
    assert.doesNotMatch(operation.query, /mutation|quantityAvailable/);
    let data;
    if (operation.query.includes("StorefrontCollections("))
      data = {
        collections: {
          nodes: [
            {
              id: "cat",
              handle: "home",
              title: "المنزل",
              description: "",
              image: null,
              products: { nodes: [{ featuredImage: { url: "https://cdn.shopify.com/1.jpg" } }] },
            },
            { id: "empty", products: { nodes: [] } },
          ],
          pageInfo: info(),
        },
      };
    else if (operation.query.includes("StorefrontProducts("))
      data = {
        products: {
          nodes: [product()],
          pageInfo: info(
            operation.variables.after ? { hasPreviousPage: true } : { hasNextPage: true },
          ),
        },
      };
    else if (operation.query.includes("StorefrontCollectionProducts("))
      data = { collection: { products: { nodes: [product()], pageInfo: info() } } };
    else if (operation.query.includes("StorefrontProduct(")) data = { product: product() };
    else if (operation.query.includes("StorefrontVariantQuote("))
      data = {
        nodes: operation.variables.ids.map((id) =>
          id === "gid://shopify/ProductVariant/2"
            ? {
                ...variant(2, quotePrice, { availableForSale: quoteAvailable }),
                product: {
                  id: "gid://shopify/Product/1",
                  handle: "real-product",
                  title: "منتج حقيقي",
                  availableForSale: true,
                },
              }
            : null,
        ),
      };
    else throw new Error("Unexpected query");
    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" },
    });
  };
  const provider = createShopifyCatalog(
    { SHOPIFY_STORE_DOMAIN: "indexesstore.myshopify.com" },
    { fetcher, ...options },
  );
  return {
    provider,
    calls,
    fetcher,
    update(price, available = true) {
      quotePrice = price;
      quoteAvailable = available;
    },
  };
}

test("Shopify source preserves variant identity, image, amount, currency and selection", () => {
  const p = product();
  p.title = "<script>alert(1)</script>";
  p.description = "<img src=x onerror=alert(1)>";
  const model = shopifyProductModel(p, "2");
  assert.equal(model.selected_or_first_available_variant.id, "gid://shopify/ProductVariant/2");
  assert.equal(model.price, 2350000);
  assert.equal(model.currency, "YER");
  assert.equal(model.has_only_default_variant, false);
  assert.equal(model.stock, null);
  assert.match(model.description, /&lt;img/);
  assert.doesNotMatch(model.description, /<img/);
});

test("real collections and product cursor pagination keep source filters and sort", async () => {
  const { provider, calls } = source();
  const cats = await provider.categories();
  assert.equal(cats.length, 1);
  assert.equal(cats[0].image, "https://cdn.shopify.com/1.jpg");
  const url = new URL("https://preview.example/search?q=جهاز&in_stock=1&sort_by=price-descending");
  const first = await provider.list(url, cats);
  const vars = calls.at(-1).variables;
  assert.equal(vars.sort, "PRICE");
  assert.equal(vars.reverse, true);
  assert.match(vars.query, /جهاز.*available_for_sale:true/);
  assert.equal(first.paginate.total_known, false);
  const next = new URL(first.paginate.next.url, url);
  assert.equal(next.searchParams.get("q"), "جهاز");
  assert.equal(next.searchParams.get("after"), "end");
  const second = await provider.list(next, cats);
  assert.ok(second.paginate.previous);
  assert.equal(new URL(second.paginate.previous.url, url).searchParams.get("before"), "start");
  await provider.list(
    new URL("https://preview.example/collections/home?in_stock=1"),
    cats,
    cats[0],
  );
  assert.deepEqual(calls.at(-1).variables.filters, [{ available: true }]);
});

test("quotes ignore browser prices and re-read Shopify even when catalog responses are cached", async () => {
  const storage = new Map();
  const cache = {
    async match(key) {
      return storage.get(key.url)?.clone();
    },
    async put(key, response) {
      storage.set(key.url, response.clone());
    },
  };
  const { provider, calls, update } = source({ cache });
  await provider.product("real-product");
  await provider.product("real-product");
  assert.equal(calls.length, 1);
  const lines = [{ id: "gid://shopify/ProductVariant/2", quantity: 2, price: 1 }];
  let quote = await provider.quote(lines);
  assert.equal(quote[0].price, 23500);
  assert.equal(quote[0].line_total, 47000);
  assert.equal(quote[0].stock_known, false);
  update(25000);
  quote = await provider.quote(lines);
  assert.equal(quote[0].price, 25000);
  assert.equal(quote[0].line_total, 50000);
  update(25000, false);
  assert.equal((await provider.quote(lines))[0].available, false);
  assert.equal(calls.filter((c) => c.query.includes("StorefrontVariantQuote")).length, 3);
});

test("removed variants and old D1 cart ids remain unavailable rather than mapping by title", async () => {
  const { provider, calls } = source();
  const quote = await provider.quote([
    { id: "old-d1-uuid", quantity: 1 },
    { id: "gid://shopify/ProductVariant/999", quantity: 1 },
  ]);
  assert.ok(quote.every((line) => !line.available));
  assert.deepEqual(calls[0].variables.ids, ["gid://shopify/ProductVariant/999"]);
});

test("provider fails closed for inaccessible source, GraphQL errors and invalid shop host", async () => {
  assert.throws(() => createShopifyCatalog({ SHOPIFY_STORE_DOMAIN: "evil.example/path" }));
  for (const response of [
    new Response("offline", { status: 503 }),
    new Response(JSON.stringify({ errors: [{ message: "Denied" }] })),
  ]) {
    const provider = createShopifyCatalog(
      { SHOPIFY_STORE_DOMAIN: "indexesstore.myshopify.com" },
      { fetcher: async () => response },
    );
    await assert.rejects(provider.categories());
  }
});

test("product detail loads all additional source variants and images", async () => {
  let calls = 0;
  const provider = createShopifyCatalog(
    { SHOPIFY_STORE_DOMAIN: "indexesstore.myshopify.com" },
    {
      fetcher: async (_url, init) => {
        const op = JSON.parse(init.body);
        calls++;
        let data;
        if (op.query.includes("StorefrontProduct(")) {
          const p = product();
          p.variants.pageInfo.hasNextPage = true;
          p.images.pageInfo.hasNextPage = true;
          data = { product: p };
        } else if (op.query.includes("StorefrontProductVariants("))
          data = { product: { variants: { nodes: [variant(3, 30000)], pageInfo: info() } } };
        else
          data = {
            product: {
              images: {
                nodes: [{ id: "image2", url: "https://cdn.shopify.com/3.jpg" }],
                pageInfo: info(),
              },
            },
          };
        return new Response(JSON.stringify({ data }));
      },
    },
  );
  const p = await provider.product("real-product", "3");
  assert.equal(calls, 3);
  assert.equal(p.variants.length, 3);
  assert.equal(p.images.length, 2);
  assert.equal(p.price, 3000000);
});

test("hosted route adapter uses Shopify for detail and authoritative variant quote without reading legacy catalog", async (t) => {
  const mock = source();
  t.mock.method(globalThis, "fetch", mock.fetcher);
  const env = {
    CATALOG_SOURCE: "shopify",
    SHOPIFY_STORE_DOMAIN: "indexesstore.myshopify.com",
    DB: {
      prepare() {
        throw new Error("legacy catalog must not be read");
      },
    },
  };
  const page = await worker.fetch(
    new Request("https://preview.example/products/real-product?variant=2"),
    env,
  );
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /value="gid:\/\/shopify\/ProductVariant\/2"/);
  assert.match(html, /https:\/\/cdn.shopify.com\/1.jpg/);
  const response = await worker.fetch(
    new Request("https://preview.example/api/cart/quote", {
      method: "POST",
      body: JSON.stringify({
        items: [{ id: "gid://shopify/ProductVariant/2", quantity: 1, price: 1 }],
      }),
    }),
    env,
  );
  const quote = await response.json();
  assert.equal(quote.items[0].price, 23500);
  assert.equal(quote.valid, true);
  assert.match(new URL(quote.whatsapp_url).searchParams.get("text"), /خيار 2/);
  assert.match(new URL(quote.whatsapp_url).searchParams.get("text"), /variant=2/);
});
