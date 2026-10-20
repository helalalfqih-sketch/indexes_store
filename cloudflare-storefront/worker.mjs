import { escape, safeURL, money } from "./catalog-format.mjs";
import { createShopifyCatalog } from "./shopify-catalog.mjs";
import { Liquid } from "liquidjs/dist/liquid.browser.mjs";
import { templates, assets, translations, settings, brand, revision } from "storefront:resources";

const PUBLIC_PRODUCT_COLUMNS =
  "p.id,p.slug,p.name,p.description,p.price,p.old_price,p.currency,p.category_id,p.images,p.stock,p.reserved_stock,p.rating,p.reviews_count,p.tags,p.featured,p.is_deal";
const ACTIVE_PRODUCT =
  "p.tenant_id = ? AND p.is_published = 1 AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = p.tenant_id AND t.status = 'active')";
const array = (value) => {
  try {
    const x = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
};
const artwork = {
  automotive: "السيارات-وملحقاتها",
  electronics: "الإلكترونيات-والهواتف",
  electronic: "الإلكترونيات-والهواتف",
  "sports-fitness": "الرياضة-واللياقة",
  "beauty-care": "الصحة-والجمال",
  "health-massage": "الصحة-والجمال",
  "storage-organization": "المنزل-والمطبخ",
  kitchen: "المنزل-والمطبخ",
  "kids-toys": "الألعاب-والأطفال",
};
const engine = new Liquid({
  cache: true,
  ownPropertyOnly: true,
  relativeReference: false,
  fs: {
    resolve: (_root, file) => file.replace(/\.liquid$/, ""),
    existsSync: (file) => Object.hasOwn(templates, file),
    exists: async (file) => Object.hasOwn(templates, file),
    readFileSync: (file) => templates[file],
    readFile: async (file) => templates[file],
    dirname: () => "",
    contains: () => true,
  },
});
engine.registerFilter("t", (key, ...args) => {
  let result = key.split(".").reduce((obj, name) => obj?.[name], translations) ?? key;
  for (const arg of args)
    if (Array.isArray(arg)) result = String(result).replaceAll(`{{ ${arg[0]} }}`, arg[1]);
  return result;
});
engine.registerFilter("json", (value) => JSON.stringify(value).replace(/</g, "\\u003c"));
engine.registerFilter("asset_url", (name) => `/assets/${name}?v=${revision}`);
engine.registerFilter("stylesheet_tag", (url) => `<link rel="stylesheet" href="${escape(url)}">`);
engine.registerFilter("image_url", (value) => safeURL(value));
engine.registerFilter("image_tag", (url, ...args) => {
  const options = Object.fromEntries(args.filter(Array.isArray));
  return `<img src="${escape(url || "/assets/unavailable.svg")}" alt="${escape(options.alt)}" loading="${escape(options.loading || "lazy")}" decoding="async">`;
});
engine.registerFilter(
  "placeholder_svg_tag",
  () => '<img src="/assets/unavailable.svg" alt="الصورة غير متاحة" loading="lazy">',
);
engine.registerFilter("money_with_currency", function (value) {
  return escape(
    money(Number(value || 0) / 100, this.context.get(["product", "currency"]) || "YER"),
  );
});
engine.registerFilter("default_pagination", (page) => page?.html || "");

function productModel(row, categories = []) {
  const images = array(row.images)
    .map(safeURL)
    .filter(Boolean)
    .map((src, i) => ({ src, id: `${row.id}-${i}`, alt: row.name }));
  const media = images.map((image) => ({ ...image, media_type: "image", preview_image: image }));
  const stock = Math.max(0, Number(row.stock || 0) - Number(row.reserved_stock || 0));
  // D1 amounts are kept in their existing units and currency. Liquid's theme
  // contract uses hundredths; this conversion is confined to that contract.
  const variant = {
    id: row.id,
    title: "المنتج",
    price: Number(row.price) * 100,
    compare_at_price: row.old_price ? Number(row.old_price) * 100 : null,
    available: stock > 0,
    featured_media: media[0],
  };
  return {
    id: row.id,
    handle: row.slug,
    title: row.name,
    url: `/products/${encodeURIComponent(row.slug)}`,
    description: escape(row.description).replace(/\n/g, "<br>"),
    price: variant.price,
    currency: row.currency || "YER",
    stock,
    images,
    media,
    featured_media: media[0],
    featured_image: images[0]?.src || "/assets/unavailable.svg",
    tags: array(row.tags),
    selected_or_first_available_variant: variant,
    variants: [variant],
    has_only_default_variant: true,
    collections: categories.filter((c) => c.id === row.category_id),
    metafields: {
      reviews:
        Number(row.reviews_count) > 0
          ? {
              rating: { value: { rating: row.rating } },
              rating_count: { value: row.reviews_count },
            }
          : {},
      custom: {},
    },
  };
}

const render = (name, context) => engine.renderFileSync(name, context, { globals: context });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
async function categories(env) {
  const { results } = await env.DB.prepare(
    `SELECT c.id,c.slug,c.name,c.description,c.image_url,c.sort,COUNT(p.id) AS products_count
    FROM categories c JOIN tenants t ON t.id=c.tenant_id AND t.status='active'
    LEFT JOIN products p ON p.category_id=c.id AND p.tenant_id=c.tenant_id AND p.is_published=1
    WHERE c.tenant_id=? GROUP BY c.id ORDER BY c.sort,c.name`,
  )
    .bind(env.TENANT_ID)
    .all();
  return results.map((c) => ({
    ...c,
    title: c.name,
    products_count_known: true,
    handle: c.slug,
    artwork_handle: artwork[c.slug] || c.slug,
    image: safeURL(c.image_url),
    url: `/collections/${encodeURIComponent(c.slug)}`,
  }));
}
function listQuery(url, category, deals) {
  let where = ACTIVE_PRODUCT;
  const params = [];
  if (category) {
    where += " AND p.category_id=?";
    params.push(category.id);
  }
  if (deals) where += " AND p.is_deal=1";
  const q = (url.searchParams.get("q") || "").trim().slice(0, 160);
  if (q) {
    where += " AND (p.name LIKE ? ESCAPE '\\' OR p.description LIKE ? ESCAPE '\\')";
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    params.push(pattern, pattern);
  }
  if (url.searchParams.get("in_stock") === "1") where += " AND p.stock > p.reserved_stock";
  const sorts = {
    manual: "p.featured DESC,p.id",
    "title-ascending": "p.name,p.id",
    "title-descending": "p.name DESC,p.id",
    "price-ascending": "p.currency,p.price,p.id",
    "price-descending": "p.currency,p.price DESC,p.id",
    "created-descending": "p.created_at DESC,p.id",
  };
  const sort = url.searchParams.get("sort_by") || "manual";
  return { where, params, q, sort, order: sorts[sort] || sorts.manual };
}
async function products(env, url, cats, category, deals = false) {
  const query = listQuery(url, category, deals);
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM products p WHERE ${query.where}`)
    .bind(env.TENANT_ID, ...query.params)
    .first();
  const pages = Math.max(1, Math.ceil(count.n / 24));
  const page = Math.min(pages, Math.max(1, Math.trunc(Number(url.searchParams.get("page"))) || 1));
  const { results } = await env.DB.prepare(
    `SELECT ${PUBLIC_PRODUCT_COLUMNS} FROM products p WHERE ${query.where} ORDER BY ${query.order} LIMIT 24 OFFSET ?`,
  )
    .bind(env.TENANT_ID, ...query.params, (page - 1) * 24)
    .all();
  const pageURL = (n) => {
    const next = new URL(url);
    next.searchParams.set("page", n);
    return next.pathname + next.search;
  };
  return {
    items: results.map((row) => productModel(row, cats)),
    q: query.q,
    sort: query.sort,
    paginate: {
      items: count.n,
      total_known: true,
      pages,
      current_page: page,
      previous: page > 1 ? { url: pageURL(page - 1) } : null,
      next: page < pages ? { url: pageURL(page + 1) } : null,
      html: `${page > 1 ? `<a href="${escape(pageURL(page - 1))}">السابق</a>` : ""}${pages > 1 ? `<span>صفحة ${page} من ${pages}</span>` : ""}${page < pages ? `<a href="${escape(pageURL(page + 1))}">التالي</a>` : ""}`,
    },
  };
}
async function product(env, slug, cats) {
  const row = await env.DB.prepare(
    `SELECT ${PUBLIC_PRODUCT_COLUMNS} FROM products p WHERE ${ACTIVE_PRODUCT} AND (p.slug=? OR p.id=?) LIMIT 1`,
  )
    .bind(env.TENANT_ID, slug, slug)
    .first();
  return row ? productModel(row, cats) : null;
}
async function quote(request, env, origin, source) {
  if (request.headers.get("origin") && request.headers.get("origin") !== origin)
    return json({ error: "طلب غير مسموح" }, 403);
  const text = await request.text();
  if (text.length > 12000) return json({ error: "السلة كبيرة جدًا" }, 413);
  let input;
  try {
    input = JSON.parse(text);
  } catch {
    return json({ error: "بيانات غير صالحة" }, 400);
  }
  if (
    !input ||
    typeof input !== "object" ||
    !Array.isArray(input.items) ||
    input.items.length > 50 ||
    input.items.some(
      (i) =>
        !i ||
        typeof i.id !== "string" ||
        i.id.length > 160 ||
        !Number.isSafeInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > 99,
    )
  )
    return json({ error: "تحقق من الكميات" }, 400);
  const ids = [...new Set(input.items.map((i) => i.id))];
  if (ids.length !== input.items.length) return json({ error: "منتج مكرر" }, 400);
  let items;
  if (source) items = await source.quote(input.items);
  else {
    const result = ids.length
      ? await env.DB.prepare(
          `SELECT ${PUBLIC_PRODUCT_COLUMNS} FROM products p WHERE ${ACTIVE_PRODUCT} AND p.id IN (${ids.map(() => "?").join(",")})`,
        )
          .bind(env.TENANT_ID, ...ids)
          .all()
      : { results: [] };
    items = input.items.map((line) => {
      const row = result.results.find((p) => p.id === line.id);
      if (!row)
        return {
          id: line.id,
          quantity: line.quantity,
          available: false,
          reason: "هذا المنتج غير متاح حاليًا",
        };
      const p = productModel(row);
      const available = p.stock >= line.quantity && row.price > 0;
      return {
        id: p.id,
        title: p.title,
        url: p.url,
        image: p.featured_image,
        quantity: line.quantity,
        stock: p.stock,
        price: row.price,
        currency: p.currency,
        price_label: money(row.price, p.currency),
        line_total: row.price * line.quantity,
        line_label: money(row.price * line.quantity, p.currency),
        available,
        reason: available ? "" : "الكمية المطلوبة غير متاحة أو السعر يحتاج تأكيدًا",
      };
    });
  }
  const totals = {};
  for (const line of items)
    if (line.available)
      totals[line.currency] =
        Math.round(((totals[line.currency] || 0) + line.line_total) * 100) / 100;
  const valid = items.length > 0 && items.every((i) => i.available);
  const message = [
    "السلام عليكم، أود الاستفسار عن طلب:",
    ...items
      .filter((i) => i.available)
      .map(
        (i) =>
          `${i.title} | الكمية: ${i.quantity} | سعر الوحدة: ${i.price_label} | الإجمالي: ${i.line_label} | ${origin}${i.url}`,
      ),
    ...Object.entries(totals).map(
      ([currency, amount]) => `المجموع (${currency}): ${money(amount, currency)}`,
    ),
    "تكلفة التوصيل والتوفر والسعر النهائي تخضع للتأكيد عبر واتساب. هذه مراجعة للطلب وليست تأكيد شراء.",
  ].join("\n");
  return json({
    items,
    totals: Object.entries(totals).map(([currency, amount]) => ({
      currency,
      amount,
      label: money(amount, currency),
    })),
    valid,
    whatsapp_url: valid ? `https://wa.me/967771370740?text=${encodeURIComponent(message)}` : null,
  });
}
function pageHTML(content, context, title) {
  const css = [
    "indexes-unified.css",
    "indexes-pages.css",
    "indexes-whatsapp-preview.css",
    "indexes-ux.css",
    "indexes-brand-identity.css",
    "d1.css",
  ];
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | اندكس ستور</title><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#e0000b">${css.map((name) => `<link rel="stylesheet" href="/assets/${name}?v=${revision}">`).join("")}<link rel="icon" href="https://cdn.shopify.com/s/files/1/0664/0110/8053/files/indexes-store-symbol-20261017.jpg"></head><body><a class="ix-skip" href="#MainContent">انتقل إلى المحتوى</a><div class="page-wrapper">${render("indexes-global-shell", context)}<main id="MainContent" class="content-for-layout">${content}</main>${render("indexes-footer", context)}</div><div id="ix-status" role="status" aria-live="polite"></div><script src="/assets/indexes-ux.js?v=${revision}" defer></script><script src="/assets/indexes-ui.js?v=${revision}" defer></script><script src="/assets/d1.js?v=${revision}" defer></script></body></html>`;
}
async function handle(request, env) {
  const url = new URL(request.url);
  let path;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return new Response("رابط غير صالح", { status: 400 });
  }
  if (path.startsWith("/assets/")) {
    const name = path.slice(8);
    const body = Object.hasOwn(assets, name) ? assets[name] : undefined;
    return new Response(body ?? "Not found", {
      status: body === undefined ? 404 : 200,
      headers: {
        "Content-Type": name.endsWith(".css")
          ? "text/css"
          : name.endsWith(".svg")
            ? "image/svg+xml"
            : "text/javascript",
        "Cache-Control":
          url.searchParams.get("v") === revision
            ? "public,max-age=31536000,immutable"
            : "public,max-age=300",
      },
    });
  }
  const source = env.CATALOG_SOURCE === "shopify" ? createShopifyCatalog(env) : null;
  if (path === "/api/cart/quote" && request.method === "POST")
    return quote(request, env, url.origin, source);
  if (!["GET", "HEAD"].includes(request.method))
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  if (path === "/health") {
    await env.DB.prepare("SELECT 1").first();
    return json({
      ok: true,
      database: "D1",
      catalog: source ? "shopify" : "d1",
      store: source ? env.SHOPIFY_STORE_DOMAIN : null,
      revision,
    });
  }
  const cats = source ? await source.categories() : await categories(env);
  const collections = Object.fromEntries(cats.map((c) => [c.handle, c]));
  for (const c of cats) collections[c.artwork_handle] ??= c;
  // Promotional artwork for departments absent from D1 opens the full catalog.
  for (const key of ["الهدايا-والهوايات", "الأدوات-والمعدات"])
    collections[key] ??= { url: "/collections/all" };
  const context = {
    catalog_source: source ? "shopify" : "d1",
    settings,
    category_list: cats,
    collections,
    shop: {
      name: "اندكس ستور",
      url: url.origin,
      currency: "YER",
      customer_accounts_enabled: false,
      policies: [],
    },
    routes: {
      root_url: "/",
      collections_url: "/collections",
      all_products_collection_url: "/collections/all",
      cart_url: "/cart",
      cart_add_url: "/cart/add",
      search_url: "/search",
      account_url: "/account",
    },
    cart: { item_count: 0, currency: { iso_code: "YER" } },
    template: { name: "index" },
    section: {
      id: "d1-home",
      settings: {
        brand_identity_title: "اندكس ستور",
        brand_identity_text: "تعرّف على علامتنا وتفاصيل هويتنا البصرية.",
        brand_identity_link: "استكشف هويتنا",
      },
    },
    page: {},
    canonical_url: url.origin + url.pathname,
  };
  let content;
  let title = "الرئيسية";
  let status = 200;
  const match = path.match(/^\/products\/(.+?)(\.js)?$/);
  if (match) {
    const p = source
      ? await source.product(match[1], url.searchParams.get("variant"))
      : await product(env, match[1], cats);
    if (match[2]) return p ? json(p) : json({ error: "المنتج غير موجود" }, 404);
    if (p) {
      context.product = p;
      context.template.name = "product";
      title = p.title;
      content = render("indexes-product", context);
    }
  } else if (path === "/search/suggest.json") {
    const list = source ? await source.list(url, cats) : await products(env, url, cats);
    const q = list.q;
    return json({
      resources: {
        results: {
          products: q ? list.items.slice(0, 8).map((p) => ({ title: p.title, url: p.url })) : [],
          collections: q
            ? cats
                .filter((c) => c.title.includes(q))
                .slice(0, 4)
                .map((c) => ({ title: c.title, url: c.url }))
            : [],
        },
      },
    });
  } else if (path === "/collections") {
    context.template.name = "list-collections";
    title = "الأقسام الرئيسية";
    content = render("d1-collections", context);
  } else if (
    path === "/" ||
    path === "/search" ||
    path === "/pages/offers" ||
    path.startsWith("/collections/")
  ) {
    const key = path.startsWith("/collections/") ? path.slice(13) : null;
    const category =
      key && key !== "all" ? cats.find((c) => c.handle === key || c.artwork_handle === key) : null;
    if (!key || key === "all" || category) {
      const list = source
        ? await source.list(url, cats, category, path === "/pages/offers")
        : await products(env, url, cats, category, path === "/pages/offers");
      context.paginate = list.paginate;
      context.collections.all = { products: list.items };
      context.search = { terms: list.q };
      if (path === "/") content = render("indexes-mobile-home", context);
      else {
        title =
          path === "/search"
            ? list.q
              ? `نتائج البحث: ${list.q}`
              : "البحث"
            : path === "/pages/offers"
              ? "العروض"
              : category?.title || "جميع المنتجات";
        context.collection = {
          ...category,
          title,
          products: list.items,
          sort_by: list.sort,
          sort_options: [
            { value: "manual", name: "المميزة" },
            { value: "title-ascending", name: "الاسم" },
            { value: "price-ascending", name: "السعر" },
            { value: "price-descending", name: "السعر" },
            { value: "created-descending", name: "الأحدث" },
          ],
          filters: [
            {
              type: "list",
              label: "التوفر",
              values: [
                {
                  label: "متوفر فقط",
                  param_name: "in_stock",
                  value: "1",
                  active: url.searchParams.get("in_stock") === "1",
                  count: list.paginate.items,
                },
              ],
            },
          ],
          url: url.pathname,
        };
        context.template.name = path === "/search" ? "search" : "collection";
        content = render("indexes-collection", context);
      }
    }
  } else if (path === "/cart" || path === "/pages/complete-order") {
    title = "سلة التسوق";
    context.template.name = "cart";
    content = render("d1-cart", context);
  } else if (path === "/pages/wishlist") {
    title = "المفضلة";
    context.page.handle = "wishlist";
    content = render("indexes-wishlist", context);
  } else if (path === "/account") {
    title = "حسابي";
    context.page.handle = "my-account";
    content = render("d1-account", context);
  } else if (path === "/pages/about" || path === "/pages/contact") {
    title = "التواصل ومعلومات الطلب";
    content = render("d1-about", context);
  } else if (path === "/pages/brand-identity") {
    title = "هوية اندكس ستور";
    context.section = brand;
    content = render("indexes-brand-gallery", context);
  } else if (path === "/robots.txt")
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain" },
    });
  if (content === undefined) {
    status = 404;
    title = "الصفحة غير موجودة";
    content =
      '<section class="ix-page ix-empty-state"><h1>الصفحة غير موجودة</h1><a href="/">العودة إلى الرئيسية</a></section>';
  }
  return new Response(request.method === "HEAD" ? null : pageHTML(content, context, title), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
export default {
  async fetch(request, env) {
    let response;
    try {
      response = await handle(request, env);
    } catch (error) {
      console.error("Storefront request failed", error.message);
      response = new Response(
        '<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تعذر تحميل المتجر</title><h1>تعذر تحميل المتجر مؤقتًا</h1><p>حاول تحديث الصفحة بعد قليل.</p><a href="/">إعادة المحاولة</a></html>',
        {
          status: 503,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        },
      );
    }
    const secured = new Response(response.body, response);
    secured.headers.set("X-Content-Type-Options", "nosniff");
    secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    secured.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    return secured;
  },
};
