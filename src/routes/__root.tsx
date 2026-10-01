import { HeadContent, Outlet, Scripts, createRootRoute, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { reportLovableError } from "@/lib/lovable-error";
import { getSeoConfig } from "@/lib/seo";
import appCss from "../styles.css?url";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/hooks/useLocale";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { FloatingWhatsApp } from "@/components/store/FloatingWhatsApp";
import { RootSeoJsonLd } from "@/components/seo/RootSeoJsonLd";
import { PwaServiceWorkerCleanup } from "@/components/pwa/PwaServiceWorkerCleanup";

export const Route = createRootRoute({
  head: () => {
    const seo = getSeoConfig();
    const siteName = seo.siteName || "اندكس";
    const title = siteName;
    const description =
      "متجر إلكتروني شامل لأحدث المنتجات. تسوق بسهولة وأمان مع أفضل الأسعار وخدمة توصيل لجميع المحافظات.";
    const image =
      seo.defaultOgImage ||
      "https://wtudcippyxbaobqzbmok.supabase.co/storage/v1/object/public/product-images/uploads/1766594403653-logo.jpg";

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        { name: "theme-color", content: "#10b981" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "apple-mobile-web-app-title", content: siteName },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "ar_YE" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/png", href: seo.favicon || "/pwa-192x192.png" },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
      ],
    };
  },
  errorComponent: ErrorComponent,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <RootSeoJsonLd />
      <PwaServiceWorkerCleanup />
      <CartProvider>
        <WishlistProvider>
          <LocaleProvider>
            <Outlet />
            <FloatingWhatsApp />
            <Toaster richColors position="top-center" />
          </LocaleProvider>
        </WishlistProvider>
      </CartProvider>
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
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

import { MonitoringService } from "../lib/monitoring/sentry";

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  console.error(normalizedError);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(normalizedError, { boundary: "tanstack_root_error_component" });
    MonitoringService.captureException(normalizedError, { component: "RootErrorComponent" });
  }, [normalizedError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold text-foreground">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-muted-foreground">حاول مرة أخرى أو ارجع للصفحة الرئيسية.</p>
        {error != null && (
          <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono text-left overflow-auto max-h-40 whitespace-pre-wrap">
            <strong>Error:</strong> {normalizedError.message}
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
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground"
          >
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
