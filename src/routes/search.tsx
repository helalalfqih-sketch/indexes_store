import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { VStack } from "@astryxdesign/core/VStack";
import { Grid } from "@astryxdesign/core/Grid";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { z } from "zod";
import { ProductCard } from "@/components/product-card";
import { searchProductsAdvanced } from "@/lib/search-engine";
import { categoriesQueryOptions } from "@/lib/store.queries";
const searchParamsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  dealsOnly: z.boolean().optional(),
  inStockOnly: z.boolean().optional(),
  sortBy: z.enum(["bestselling", "latest", "price_asc", "price_desc", "rating"]).optional(),
});
export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "البحث والمنتجات — اندكس ستور" }] }),
  validateSearch: searchParamsSchema,
  component: SearchPage,
});
function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(params.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setTerm(params.q ?? ""), [params.q]);
  const categories = useQuery(categoriesQueryOptions());
  const query = useQuery({
    queryKey: ["storefront-search", params],
    queryFn: ({ signal }) =>
      searchProductsAdvanced(
        {
          search: params.q ?? "",
          categoryId: params.category ?? "all",
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          dealsOnly: params.dealsOnly,
          inStockOnly: params.inStockOnly,
          sortBy: params.sortBy ?? "latest",
        },
        signal,
      ),
  });
  const update = (next: Partial<z.infer<typeof searchParamsSchema>>) => {
    void navigate({ search: { ...params, ...next } });
  };
  const activeFilters = Boolean(
    params.category ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined ||
    params.dealsOnly ||
    params.inStockOnly,
  );
  return (
    <VStack as="section" className="sf-page" gap={4}>
      <header className="sf-page-heading">
        <h1>{params.q ? `نتائج البحث عن «${params.q}»` : "جميع المنتجات"}</h1>
        <p>ابحث بالاسم أو حدد خيارات التصفية</p>
      </header>
      <form
        className="sf-search-form"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: term.trim() || undefined });
        }}
      >
        <label className="sr-only" htmlFor="catalog-search">
          البحث عن منتج
        </label>
        <input
          id="catalog-search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="ابحث عن منتج…"
        />
        <button type="submit" className="sf-icon-button" aria-label="تنفيذ البحث">
          <Search />
        </button>
      </form>
      <section className="sf-filter-toolbar" aria-label="خيارات عرض المنتجات">
        <button
          className="sf-secondary-button"
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
        >
          <SlidersHorizontal /> التصفية{activeFilters ? " •" : ""}
        </button>
        <label>
          الترتيب{" "}
          <select
            aria-label="ترتيب المنتجات"
            value={params.sortBy ?? "latest"}
            onChange={(event) =>
              update({ sortBy: event.target.value as "latest" | "price_asc" | "price_desc" })
            }
          >
            <option value="latest">الأحدث</option>
            <option value="price_asc">السعر: من الأقل</option>
            <option value="price_desc">السعر: من الأعلى</option>
          </select>
        </label>
        {activeFilters && (
          <button
            className="sf-text-button"
            onClick={() => {
              void navigate({ search: { q: params.q, sortBy: params.sortBy } });
            }}
          >
            مسح التصفية
          </button>
        )}
      </section>
      {filtersOpen && (
        <Grid
          id="catalog-filters"
          className="sf-panel sf-filters"
          columns={{ minWidth: 160 }}
          gap={4}
        >
          <label>
            القسم
            <select
              value={params.category ?? "all"}
              onChange={(event) =>
                update({ category: event.target.value === "all" ? undefined : event.target.value })
              }
            >
              <option value="all">جميع الأقسام</option>
              {categories.data?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            أقل سعر
            <input
              type="number"
              min={0}
              value={params.minPrice ?? ""}
              onChange={(event) =>
                update({ minPrice: event.target.value ? Number(event.target.value) : undefined })
              }
            />
          </label>
          <label>
            أعلى سعر
            <input
              type="number"
              min={0}
              value={params.maxPrice ?? ""}
              onChange={(event) =>
                update({ maxPrice: event.target.value ? Number(event.target.value) : undefined })
              }
            />
          </label>
          <label className="sf-check">
            <input
              type="checkbox"
              checked={params.dealsOnly ?? false}
              onChange={(event) => update({ dealsOnly: event.target.checked || undefined })}
            />{" "}
            العروض فقط
          </label>
          <label className="sf-check">
            <input
              type="checkbox"
              checked={params.inStockOnly ?? false}
              onChange={(event) => update({ inStockOnly: event.target.checked || undefined })}
            />{" "}
            المتوفر فقط
          </label>
        </Grid>
      )}
      {query.isPending ? (
        <p role="status" aria-live="polite">
          جارٍ تحميل المنتجات…
        </p>
      ) : query.isError ? (
        <section className="sf-empty" role="alert">
          <h2>تعذر تحميل المنتجات</h2>
          <p>حاول مرة أخرى بعد التحقق من اتصالك.</p>
          <button className="sf-secondary-button" onClick={() => query.refetch()}>
            إعادة المحاولة
          </button>
        </section>
      ) : query.data.length ? (
        <>
          <p className="sf-result-count" aria-live="polite">
            {query.data.length} منتج
          </p>
          <Grid columns={{ minWidth: 145, max: 6 }} gap={3} className="sf-product-grid">
            {query.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Grid>
        </>
      ) : (
        <section className="sf-empty" role="status">
          <PackageSearch aria-hidden="true" />
          <h2>لا توجد منتجات مطابقة</h2>
          <p>جرّب كلمة أخرى أو امسح خيارات التصفية.</p>
          <Link to="/search" search={{}} className="sf-primary-button">
            عرض جميع المنتجات
          </Link>
        </section>
      )}
    </VStack>
  );
}
