import { QueryClient, queryOptions } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreThemeLayout } from "../components/store-theme-layout";
import { supabase } from "@/integrations/supabase/client";
import { TenantProvider } from "@/components/tenant-provider";
import { AppearanceProvider } from "@/components/appearance-provider";
import { Toaster } from "@/components/ui/sonner";
import { getStorefrontAppearance } from "@/lib/actions/appearance.actions";
import type { StorefrontSettingsShape } from "@/lib/domain/appearance";
import { NetworkManager } from "@/components/network-manager";
import { PersistentShowcaseCanvas } from "@/components/persistent/PersistentShowcaseCanvas";
import {
  generateOrganizationJsonLd,
  generateLocalBusinessJsonLd,
  generateWebsiteJsonLd,
  DEFAULT_OG_IMAGE,
} from "@/lib/seo";

const idbPersister = {
  persistClient: async (client: any) => {
    await set("react-query-offline-cache", client);
  },
  restoreClient: async () => {
    return await get("react-query-offline-cache");
  },
  removeClient: async () => {
    await del("react-query-offline-cache");
  },
};

function NotFoundComponent() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/app/admin")) {
        const target = path.replace(/^\/app\/admin/, "/admin") || "/admin";
        window.location.replace(target);
      }
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي تحاول الوصول إليه غير متوفر.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
          >
            العودة للرئيسية
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground shadow-card hover:bg-accent"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول مرة أخرى أو ارجع للصفحة الرئيسية.</p>
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono text-left overflow-auto max-h-40 whitespace-pre-wrap">
            <strong>Error:</strong> {error.message || String(error)}
          </div>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

/** Storefront settings query — shared cache key for the root loader (5-min fresh). */
const storefrontSettingsQueryOptions = queryOptions({
  queryKey: ["storefront-settings"],
  queryFn: async (): Promise<StorefrontSettingsShape> => getStorefrontAppearance(),
  staleTime: 5 * 60 * 1000,
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ loaderData }) => {
    // loaderData may be undefined on first render — fall back gracefully
    const seo = loaderData?.settings?.seo;
    const navigation = loaderData?.settings?.navigation;
    const title = seo?.metaTitle || "اندكس ستور — الرئيسية | تسوّق أونلاين في اليمن";
    const description =
      seo?.metaDescription ||
      "اكتشف أحدث المنتجات والعروض في اندكس ستور: إلكترونيات، أزياء، أدوات منزلية، والمزيد.";
    const ogImage = seo?.ogImage || DEFAULT_OG_IMAGE;
    const themeColor = seo?.themeColor || "#1F5EFF";
    const baseUrl =
      process.env.SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : null) ||
      import.meta.env.VITE_PUBLIC_URL ||
      "";
    const logoUrl = navigation?.logoUrl || undefined;

    // Structured data
    const orgLd = generateOrganizationJsonLd(baseUrl, logoUrl);
    const localBizLd = generateLocalBusinessJsonLd(baseUrl, logoUrl);
    const websiteLd = generateWebsiteJsonLd(baseUrl);

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
        { name: "theme-color", content: themeColor },
        { name: "msapplication-TileColor", content: themeColor },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        { name: "apple-mobile-web-app-title", content: "اندكس ستور" },
        { name: "application-name", content: "اندكس ستور" },
        { name: "author", content: "اندكس ستور" },
        { name: "format-detection", content: "telephone=no" },
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Indexes Store — اندكس ستور" },
        { property: "og:locale", content: "ar_YE" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: String(seo?.ogImageWidth || 1200) },
        { property: "og:image:height", content: String(seo?.ogImageHeight || 630) },
        { property: "og:image:alt", content: title },
        { name: "twitter:card", content: seo?.twitterCard || "summary_large_image" },
        { name: "twitter:site", content: "@indexes_store" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { name: "google-site-verification", content: "google84868c536ade5c41.html" },
        { name: "google-site-verification", content: "google2b30df2144f7547e.html" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "canonical", href: baseUrl },
        { rel: "alternate", hrefLang: "ar", href: baseUrl },
        { rel: "alternate", hrefLang: "x-default", href: baseUrl },
        // Performance: preconnect critical origins
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com" },
        { rel: "preconnect", href: "https://images.unsplash.com" },
        { rel: "dns-prefetch", href: "https://stream.mux.com" },
        { rel: "dns-prefetch", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev" },
        { rel: "manifest", href: "/manifest.json" },
      ],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(orgLd) },
        { type: "application/ld+json", children: JSON.stringify(localBizLd) },
        { type: "application/ld+json", children: JSON.stringify(websiteLd) },
      ],
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loader: async (ctx: any) => {
    // PERF: route the settings fetch through react-query so navigation never
    // repeats the server roundtrip — cached 5min, deduped, refreshed silently
    // in the background. (Realtime publish events still refresh instantly via
    // the AppearanceProvider broadcast subscription.)
    const queryClient = ctx.context.queryClient as QueryClient;
    const settings: StorefrontSettingsShape = await queryClient.ensureQueryData(
      storefrontSettingsQueryOptions,
    );
    return { settings };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});


function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { settings } = Route.useLoaderData();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const cleanPath = pathname.replace(/^\/app/, "");
  const isAdmin = cleanPath === "/admin" || cleanPath.startsWith("/admin/");
  const isBare =
    cleanPath === "/immersive-store" ||
    cleanPath.startsWith("/immersive-store/") ||
    cleanPath === "/auth" ||
    cleanPath.startsWith("/auth/");

  useEffect(() => {
    let lastUserId: string | null | undefined;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id ?? null;
      if (event === "INITIAL_SESSION") {
        lastUserId = uid;
        return;
      }
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Tab-focus or auth check re-emission for the same user → no-op.
      if (event === "SIGNED_IN" && lastUserId !== undefined && uid === lastUserId) return;
      lastUserId = uid;
      // Invalidate only user-specific data (orders, profile) — NEVER public catalog cache
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: idbPersister, maxAge: 1000 * 60 * 60 * 24 * 7 }}>
      <AppearanceProvider initialSettings={settings}>
        <TenantProvider>
          {isAdmin || isBare ? (
            <Outlet />
          ) : (
            <StoreThemeLayout>
              <PersistentShowcaseCanvas />
              <Outlet />
            </StoreThemeLayout>
          )}
          <Toaster />
          <NetworkManager />
        </TenantProvider>
      </AppearanceProvider>
    </PersistQueryClientProvider>
  );
}
