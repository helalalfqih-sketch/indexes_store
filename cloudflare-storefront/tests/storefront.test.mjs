import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import worker from "../../.tmp/storefront/worker.mjs";

function setup() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`CREATE TABLE tenants (id TEXT,status TEXT);
    INSERT INTO tenants VALUES ('store','active'),('other','active'),('disabled','suspended');
    CREATE TABLE categories (id TEXT,tenant_id TEXT,slug TEXT,name TEXT,description TEXT,image_url TEXT,sort INTEGER);
    INSERT INTO categories VALUES ('cat','store','kitchen','المطبخ','','',1);
    CREATE TABLE products (id TEXT,tenant_id TEXT,slug TEXT,name TEXT,description TEXT,price INTEGER,old_price INTEGER,currency TEXT,category_id TEXT,images TEXT,stock INTEGER,reserved_stock INTEGER,rating INTEGER,reviews_count INTEGER,tags TEXT,featured INTEGER,is_deal INTEGER,is_published INTEGER,created_at TEXT,cost_price INTEGER);`);
  const insert = sql.prepare(
    "INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  );
  const add = (id, overrides = {}) => {
    const row = {
      id,
      tenant: "store",
      slug: id,
      name: `منتج ${id}`,
      description: "وصف",
      price: 12345,
      old: 15000,
      currency: "YER",
      category: "cat",
      images: '["https://example.com/product.jpg"]',
      stock: 5,
      reserved: 1,
      rating: 4,
      reviews: 3,
      tags: "[]",
      featured: 0,
      deal: 0,
      published: 1,
      created: "2026-10-20",
      cost: 3000,
      ...overrides,
    };
    insert.run(...Object.values(row));
  };
  add("one");
  add("two", { currency: "SAR", price: 20 });
  add("hidden", { published: 0 });
  add("foreign", { tenant: "other" });
  add("suspended", { tenant: "disabled" });
  const DB = {
    prepare(query) {
      assert.match(query, /^SELECT/); // This storefront has no database mutation path.
      return {
        params: [],
        bind(...params) {
          this.params = params;
          return this;
        },
        async first() {
          return sql.prepare(query).get(...this.params) || null;
        },
        async all() {
          return { results: sql.prepare(query).all(...this.params) };
        },
      };
    },
  };
  const env = { DB, TENANT_ID: "store" };
  const fetch = (path, init) =>
    worker.fetch(new Request(`https://preview.example${path}`, init), env);
  const quote = (items) =>
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  return { fetch, quote, sql, add, env };
}

test("theme renders real scoped products, categories, details and supporting routes", async () => {
  const { fetch } = setup();
  for (const path of [
    "/",
    "/collections",
    "/collections/all",
    "/collections/kitchen",
    "/products/one",
    "/cart",
    "/account",
    "/pages/about",
    "/pages/wishlist",
    "/pages/brand-identity",
  ]) {
    const response = await fetch(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.match(html, /lang="ar" dir="rtl"/);
    assert.match(html, /ix-shell/);
    assert.doesNotMatch(html, /منتج (foreign|hidden|suspended)/);
    assert.doesNotMatch(html, /\{%|undefined/);
  }
  const home = await (await fetch("/")).text();
  assert.equal((home.match(/class="ix-product-card"/g) || []).length, 2);
  assert.match(home, /indexes-home-promo-general/);
  assert.equal((await fetch("/products/missing")).status, 404);
  assert.equal((await fetch("/collections/missing")).status, 404);
});

test("search and sorting query D1, preserve Arabic and literal wildcards", async () => {
  const { fetch } = setup();
  const html = await (await fetch(`/search?q=${encodeURIComponent("منتج one")}`)).text();
  assert.match(html, /منتج one/);
  assert.doesNotMatch(html, /data-product-id="two"/);
  assert.match(html, /name="q" value="منتج one"/);
  const empty = await (await fetch("/search?q=%25")).text();
  assert.doesNotMatch(empty, /class="ix-product-card"/);
  const suggestion = await (
    await fetch(`/search/suggest.json?q=${encodeURIComponent("منتج")}`)
  ).json();
  assert.equal(suggestion.resources.results.products.length, 2);
});

test("server quotes authoritative price, stock and separate currencies", async () => {
  const { quote } = setup();
  const response = await quote([
    { id: "one", quantity: 2, price: 1 },
    { id: "two", quantity: 1 },
  ]);
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.items[0].price, 12345);
  assert.equal(result.items[0].line_total, 24690);
  assert.deepEqual(
    result.totals.map((t) => [t.currency, t.amount]),
    [
      ["YER", 24690],
      ["SAR", 20],
    ],
  );
  const link = new URL(result.whatsapp_url);
  assert.equal(link.hostname, "wa.me");
  assert.equal(link.pathname, "/967771370740");
  assert.match(link.searchParams.get("text"), /منتج one/);
  assert.match(link.searchParams.get("text"), /https:\/\/preview.example\/products\/one/);
  assert.match(link.searchParams.get("text"), /ليست تأكيد شراء/);
});

test("unpublished, other-tenant, inactive, reserved and changed stock cannot be ordered", async () => {
  const { fetch, quote, sql } = setup();
  for (const id of ["hidden", "foreign", "suspended"]) {
    assert.equal((await fetch(`/products/${id}.js`)).status, 404);
    const result = await (await quote([{ id, quantity: 1 }])).json();
    assert.equal(result.valid, false);
    assert.equal(result.whatsapp_url, null);
  }
  assert.equal((await (await quote([{ id: "one", quantity: 5 }])).json()).valid, false);
  sql.exec("UPDATE products SET stock=0 WHERE id='one'");
  assert.equal((await (await quote([{ id: "one", quantity: 1 }])).json()).valid, false);
});

test("reject malformed quantities, duplicate ids, SQL probes and cross-origin quotes", async () => {
  const { fetch, quote } = setup();
  for (const value of [null, 1, "invalid", {}]) {
    assert.equal(
      (await fetch("/api/cart/quote", { method: "POST", body: JSON.stringify(value) })).status,
      400,
    );
  }
  for (const quantity of [0, -1, 1.5, 100, "1", null])
    assert.equal((await quote([{ id: "one", quantity }])).status, 400);
  assert.equal(
    (
      await quote([
        { id: "one", quantity: 1 },
        { id: "one", quantity: 1 },
      ])
    ).status,
    400,
  );
  const probe = await (await quote([{ id: "' OR 1=1 --", quantity: 1 }])).json();
  assert.equal(probe.valid, false);
  assert.equal(
    (
      await fetch("/api/cart/quote", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
        body: '{"items":[]}',
      })
    ).status,
    403,
  );
  assert.equal((await fetch("/cart/add", { method: "POST" })).status, 405);
  assert.equal((await fetch("/bad%ZZ")).status, 400);
});

test("escape stored content and never expose private DB fields in JSON", async () => {
  const { add, fetch } = setup();
  add("xss", {
    name: "<script>alert(1)</script>",
    description: "<img src=x onerror=alert(1)>",
    images: '["javascript:alert(1)"]',
  });
  const html = await (await fetch("/products/xss")).text();
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  const p = await (await fetch("/products/xss.js")).json();
  assert.deepEqual(p.images, []);
  assert.equal(p.cost_price, undefined);
  assert.equal(p.tenant_id, undefined);
  assert.equal((await fetch("/assets/d1.js")).headers.get("x-content-type-options"), "nosniff");
});

test("pagination does not silently drop products or cross tenant boundaries", async () => {
  const { add, fetch } = setup();
  for (let i = 0; i < 26; i++) add(`extra${i}`);
  const first = await (await fetch("/collections/all")).text();
  const second = await (await fetch("/collections/all?page=2")).text();
  assert.equal((first.match(/class="ix-product-card"/g) || []).length, 24);
  assert.equal((second.match(/class="ix-product-card"/g) || []).length, 4);
});

test("database failures return a retryable 503 without leaking SQL or credentials", async () => {
  const { env } = setup();
  env.DB = {
    prepare() {
      throw new Error("database unavailable");
    },
  };
  const response = await worker.fetch(new Request("https://preview.example/"), env);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /SELECT|database unavailable/);
});
