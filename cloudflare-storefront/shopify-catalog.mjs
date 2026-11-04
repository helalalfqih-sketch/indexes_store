import { escape, safeURL, money } from "./catalog-format.mjs";

const PAGE_INFO = "pageInfo { hasNextPage hasPreviousPage startCursor endCursor }";
const VARIANT = `id title availableForSale price { amount currencyCode }
  compareAtPrice { amount currencyCode } image { url altText }
  selectedOptions { name value } quantityRule { minimum maximum increment }`;
const productFields = (
  variants = 10,
  images = 10,
) => `id handle title description productType vendor availableForSale
  featuredImage { url altText } images(first:${images}) { nodes { id url altText } ${PAGE_INFO} }
  variants(first:${variants}) { nodes { ${VARIANT} } ${PAGE_INFO} }`;
const COLLECTIONS = `query StorefrontCollections($after:String) {
  collections(first:100,after:$after) { nodes { id handle title description image {url altText} products(first:1) { nodes { featuredImage { url altText } } } } ${PAGE_INFO} }
}`;
const LIST = `query StorefrontProducts($first:Int,$last:Int,$after:String,$before:String,$query:String,$sort:ProductSortKeys,$reverse:Boolean) {
  products(first:$first,last:$last,after:$after,before:$before,query:$query,sortKey:$sort,reverse:$reverse) {
    nodes { ${productFields()} } ${PAGE_INFO}
  }
}`;
const COLLECTION_LIST = `query StorefrontCollectionProducts($id:ID!,$first:Int,$last:Int,$after:String,$before:String,$sort:ProductCollectionSortKeys,$reverse:Boolean,$filters:[ProductFilter!]) {
  collection(id:$id) { products(first:$first,last:$last,after:$after,before:$before,sortKey:$sort,reverse:$reverse,filters:$filters) {
    nodes { ${productFields()} } ${PAGE_INFO}
  } }
}`;
const DETAIL = `query StorefrontProduct($handle:String!) { product(handle:$handle) { ${productFields(100, 100)} } }`;
const MORE_VARIANTS = `query StorefrontProductVariants($id:ID!,$after:String!) { product(id:$id) { variants(first:100,after:$after) { nodes { ${VARIANT} } ${PAGE_INFO} } } }`;
const MORE_IMAGES = `query StorefrontProductImages($id:ID!,$after:String!) { product(id:$id) { images(first:100,after:$after) { nodes { id url altText } ${PAGE_INFO} } } }`;
const QUOTE = `query StorefrontVariantQuote($ids:[ID!]!) { nodes(ids:$ids) { ... on ProductVariant {
  ${VARIANT} product { id handle title availableForSale }
} } }`;
const GID = /^gid:\/\/shopify\/ProductVariant\/[1-9]\d*$/;
const cents = (value) => Math.round(Number(value) * 100);

export function shopifyProductModel(product, selectedId) {
  const images = product.images.nodes
    .filter((image) => safeURL(image))
    .map((image) => ({ src: safeURL(image), id: image.id, alt: image.altText || product.title }));
  const media = images.map((image) => ({ ...image, media_type: "image", preview_image: image }));
  const variants = product.variants.nodes.map((v) => ({
    id: v.id,
    title: v.title === "Default Title" ? "المنتج" : v.title,
    price: cents(v.price.amount),
    currency: v.price.currencyCode,
    compare_at_price: v.compareAtPrice ? cents(v.compareAtPrice.amount) : null,
    available: v.availableForSale === true,
    featured_media: media.find((m) => m.src === safeURL(v.image)),
    quantity_rule: {
      min: v.quantityRule?.minimum || 1,
      max: v.quantityRule?.maximum ?? 99,
      step: v.quantityRule?.increment || 1,
    },
  }));
  if (!variants.length) return null;
  const selected =
    variants.find((v) => v.id === selectedId || v.id.split("/").pop() === selectedId) ||
    variants.find((v) => v.available) ||
    variants[0];
  const featured =
    selected.featured_media ||
    media.find((m) => m.src === safeURL(product.featuredImage)) ||
    media[0];
  return {
    source: "shopify",
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: escape(product.description).replace(/\n/g, "<br>"),
    url: `/products/${encodeURIComponent(product.handle)}`,
    price: selected.price,
    currency: selected.currency,
    stock: null,
    images,
    media,
    featured_media: featured,
    featured_image: featured?.src || "/assets/unavailable.svg",
    variants,
    selected_or_first_available_variant: selected,
    has_only_default_variant: variants.length === 1 && !product.variants.pageInfo.hasNextPage,
    tags: [],
    collections: [],
    metafields: { reviews: {}, custom: {} },
  };
}

export function createShopifyCatalog(env, options = {}) {
  const domain = env.SHOPIFY_STORE_DOMAIN;
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain || ""))
    throw new Error("Invalid Shopify store domain");
  const version = "2026-10";
  const endpoint = `https://${domain}/api/${version}/graphql.json`;
  const fetcher = options.fetcher || fetch;
  const cache = options.cache ?? globalThis.caches?.default;
  async function request(query, variables = {}, ttl = 60) {
    const body = JSON.stringify({ query, variables });
    let key;
    if (cache && ttl) {
      const hash = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body))),
      ]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
      key = new Request(`https://${domain}/__indexes_catalog_cache/${version}/${hash}`);
      const cached = await cache.match(key);
      if (cached) return cached.json();
    }
    const response = await fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Shopify catalog unavailable (${response.status})`);
    const result = await response.json();
    if (result.errors?.length || !result.data) throw new Error("Shopify catalog query failed");
    if (key)
      await cache.put(
        key,
        new Response(JSON.stringify(result.data), {
          headers: { "Content-Type": "application/json", "Cache-Control": `public,max-age=${ttl}` },
        }),
      );
    return result.data;
  }
  async function categories() {
    const categories = [];
    let after = null;
    for (let page = 0; page < 10; page++) {
      const data = await request(COLLECTIONS, { after }, 300);
      categories.push(
        ...data.collections.nodes
          .filter((c) => c.products.nodes.length)
          .map((c) => ({
            id: c.id,
            title: c.title,
            handle: c.handle,
            artwork_handle: c.handle,
            description: c.description,
            image: safeURL(c.image || c.products.nodes[0]?.featuredImage),
            url: `/collections/${encodeURIComponent(c.handle)}`,
            products_count_known: false,
          })),
      );
      if (!data.collections.pageInfo.hasNextPage) return categories;
      after = data.collections.pageInfo.endCursor;
    }
    throw new Error("Shopify collection pagination limit reached");
  }
  async function list(url, cats, category, deals = false) {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 160);
    const sort = url.searchParams.get("sort_by") || "manual";
    const sortKey = sort.startsWith("price-")
      ? "PRICE"
      : sort.startsWith("title-")
        ? "TITLE"
        : sort === "created-descending"
          ? "CREATED_AT"
          : "ID";
    const reverse = sort.endsWith("descending");
    const before = url.searchParams.get("before")?.slice(0, 1000) || null;
    const after = before ? null : url.searchParams.get("after")?.slice(0, 1000) || null;
    const variables = {
      first: before ? null : 24,
      last: before ? 24 : null,
      after,
      before,
      reverse,
    };
    if (deals) {
      category = cats.find((c) => /عروض|offers|sale/i.test(c.handle));
      if (!category)
        return {
          items: [],
          q,
          sort,
          paginate: { items: 0, total_known: false, pages: 1, current_page: 1, html: "" },
        };
    }
    let connection;
    if (category) {
      const data = await request(COLLECTION_LIST, {
        ...variables,
        id: category.id,
        sort:
          sortKey === "CREATED_AT" ? "CREATED" : sortKey === "ID" ? "COLLECTION_DEFAULT" : sortKey,
        filters: url.searchParams.get("in_stock") === "1" ? [{ available: true }] : [],
      });
      connection = data.collection?.products;
    } else {
      const query = [q, url.searchParams.get("in_stock") === "1" ? "available_for_sale:true" : ""]
        .filter(Boolean)
        .join(" ");
      const data = await request(LIST, { ...variables, query, sort: sortKey });
      connection = data.products;
    }
    if (!connection) throw new Error("Shopify collection unavailable");
    const page = Math.max(1, Math.trunc(Number(url.searchParams.get("page"))) || 1);
    const info = connection.pageInfo;
    const pageURL = (cursor, direction, page) => {
      const next = new URL(url);
      next.searchParams.delete("after");
      next.searchParams.delete("before");
      next.searchParams.set(direction, cursor);
      next.searchParams.set("page", page);
      return next.pathname + next.search;
    };
    const previous = info.hasPreviousPage
      ? { url: pageURL(info.startCursor, "before", Math.max(1, page - 1)) }
      : null;
    const next = info.hasNextPage ? { url: pageURL(info.endCursor, "after", page + 1) } : null;
    return {
      items: connection.nodes.map((p) => shopifyProductModel(p)).filter(Boolean),
      q,
      sort,
      paginate: {
        items: connection.nodes.length,
        total_known: false,
        pages: previous || next ? page + 1 : page,
        current_page: page,
        previous,
        next,
        html: `${previous ? `<a href="${escape(previous.url)}">السابق</a>` : ""}${previous || next ? `<span>صفحة ${page}</span>` : ""}${next ? `<a href="${escape(next.url)}">التالي</a>` : ""}`,
      },
    };
  }
  async function product(handle, selectedId) {
    if (handle.length > 300) return null;
    const data = await request(DETAIL, { handle });
    if (!data.product) return null;
    const p = data.product;
    for (const [name, query] of [
      ["variants", MORE_VARIANTS],
      ["images", MORE_IMAGES],
    ]) {
      for (let page = 0; p[name].pageInfo.hasNextPage; page++) {
        if (page >= 20) throw new Error("Shopify product pagination limit reached");
        const more = await request(query, { id: p.id, after: p[name].pageInfo.endCursor });
        if (!more.product) return null;
        p[name].nodes.push(...more.product[name].nodes);
        p[name].pageInfo = more.product[name].pageInfo;
      }
    }
    return shopifyProductModel(p, selectedId);
  }
  async function quote(lines) {
    const ids = lines.map((line) => line.id).filter((id) => GID.test(id));
    const data = ids.length ? await request(QUOTE, { ids }, 0) : { nodes: [] };
    return lines.map((line) => {
      const v = data.nodes.find((v) => v?.id === line.id);
      if (!v?.product)
        return {
          id: line.id,
          quantity: line.quantity,
          available: false,
          reason: "هذا المنتج غير متاح في كتالوج Shopify الحالي",
        };
      const price = Number(v.price.amount),
        currency = v.price.currencyCode,
        rule = v.quantityRule;
      const allowedQuantity =
        line.quantity >= (rule?.minimum || 1) &&
        (rule?.maximum == null || line.quantity <= rule.maximum) &&
        line.quantity % (rule?.increment || 1) === 0;
      const available =
        v.availableForSale === true &&
        v.product.availableForSale === true &&
        allowedQuantity &&
        Number.isFinite(price) &&
        price > 0;
      return {
        id: v.id,
        title: v.product.title + (v.title === "Default Title" ? "" : ` — ${v.title}`),
        variant_title: v.title,
        url: `/products/${encodeURIComponent(v.product.handle)}?variant=${v.id.split("/").pop()}`,
        image: safeURL(v.image) || "/assets/unavailable.svg",
        quantity: line.quantity,
        stock: null,
        stock_known: false,
        price,
        currency,
        price_label: money(price, currency),
        line_total: Math.round(price * 100 * line.quantity) / 100,
        line_label: money(Math.round(price * 100 * line.quantity) / 100, currency),
        available,
        reason: available ? "" : "الخيار أو الكمية غير متاحين حاليًا، أو السعر يحتاج تأكيدًا",
      };
    });
  }
  return { categories, list, product, quote };
}
