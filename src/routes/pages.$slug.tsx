import { createFileRoute, Link, redirect, notFound } from "@tanstack/react-router";
import { BookOpen, ArrowRight, ShieldCheck, Home, Loader2 } from "lucide-react";
import { getPublicCmsPage, sanitizeHtml, type CmsPageRecord } from "@/lib/pages.functions";

const BUILT_IN_PAGE_ROUTES: Record<string, "/terms" | "/privacy-policy"> = {
  terms: "/terms",
  "privacy-policy": "/privacy-policy",
};

export const Route = createFileRoute("/pages/$slug")({
  ssr: true,
  loader: async ({ params }): Promise<{ page: CmsPageRecord }> => {
    const builtInRoute = BUILT_IN_PAGE_ROUTES[params.slug];
    if (builtInRoute) throw redirect({ to: builtInRoute });
    const page = await getPublicCmsPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) {
      return {
        meta: [{ title: "الصفحة غير موجودة — اندكس ستور" }],
      };
    }
    return {
      meta: [
        { title: page.meta_title || `${page.title} — اندكس ستور` },
        { name: "description", content: page.meta_description || page.title },
        { property: "og:title", content: page.meta_title || page.title },
        { property: "og:description", content: page.meta_description || page.title },
        ...(page.og_image ? [{ property: "og:image", content: page.og_image }] : []),
      ],
    };
  },
  component: PublicCmsPageComponent,
});

function PublicCmsPageComponent() {
  const { page } = Route.useLoaderData();

  const cleanContent = sanitizeHtml(page.content);

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-10"
      dir="rtl"
      style={{ fontFamily: "Tajawal, system-ui, sans-serif" }}
    >
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="font-bold text-foreground">{page.title}</span>
      </nav>

      {/* Article Container */}
      <article className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-sm space-y-6">
        <header className="border-b border-border/80 pb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {page.title}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-success" /> اندكس ستور
            {page.updated_at
              ? ` · آخر تحديث: ${new Date(page.updated_at).toLocaleDateString("ar-YE")}`
              : ""}
          </p>
        </header>

        {/* Rendered HTML content */}
        <div
          className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      </article>
    </div>
  );
}
