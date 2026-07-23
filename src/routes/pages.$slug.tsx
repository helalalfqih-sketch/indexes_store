import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ArrowRight, ShieldCheck, Home, Loader2 } from "lucide-react";
import { getPublicCmsPage, sanitizeHtml } from "@/lib/pages.functions";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/pages/$slug")({
  head: ({ loaderData }: any) => {
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
  loader: async ({ params }) => {
    try {
      const page = await getPublicCmsPage({ data: { slug: params.slug } });
      return { page };
    } catch {
      return { page: null };
    }
  },
  component: PublicCmsPageComponent,
});

function PublicCmsPageComponent() {
  const { slug } = Route.useParams();
  const getPageFn = useServerFn(getPublicCmsPage);

  const { data: page, isLoading } = useQuery({
    queryKey: ["public-cms-page", slug],
    queryFn: () => getPageFn({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!page) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center" dir="rtl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-black">عذراً، الصفحة غير موجودة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            الصفحة التي تبحث عنها غير متوفرة أو قد تم إزالتها.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand hover:bg-primary/90"
            >
              <Home className="h-4 w-4" /> العودة للرئيسية
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const cleanContent = sanitizeHtml(page.content);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-10" dir="rtl" style={{ fontFamily: "Tajawal, system-ui, sans-serif" }}>
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition">الرئيسية</Link>
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
              <ShieldCheck className="h-4 w-4 text-success" /> صفحة توثيق رسمية في اندكس ستور · آخر تحديث: {new Date(page.updated_at).toLocaleDateString("ar-YE")}
            </p>
          </header>

          {/* Rendered HTML content */}
          <div
            className="prose prose-sm max-w-none dark:prose-invert leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: cleanContent }}
          />
        </article>
      </div>
    </AppShell>
  );
}
