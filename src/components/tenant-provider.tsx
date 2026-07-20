/**
 * Tenant Provider — resolves the active storefront tenant on the client
 * and exposes it via context.
 *
 * Resolution priority (client side):
 *   1. `?tenant=<slug>` query param  (dev / preview override, persisted to sessionStorage)
 *   2. sessionStorage("nozon.tenant") — sticky override
 *   3. window.location.host           — subdomain resolution on server
 *   4. Default tenant (backend fallback)
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentTenant } from "@/lib/tenant.functions";

export type CurrentTenant = {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "pending";
  isDefault: boolean;
  host: string | null;
};

type Ctx = {
  tenant: CurrentTenant | null;
  loading: boolean;
  slugOverride: string | null;
  setSlugOverride: (slug: string | null) => void;
};

const TenantCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "nozon.tenant";

function readInitialOverride(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("tenant");
  if (fromQuery) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, fromQuery);
    } catch {
      /* ignore */
    }
    return fromQuery;
  }
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [slugOverride, setSlugOverrideState] = useState<string | null>(() => readInitialOverride());

  const setSlugOverride = (slug: string | null) => {
    setSlugOverrideState(slug);
    if (typeof window !== "undefined") {
      try {
        if (slug) window.sessionStorage.setItem(STORAGE_KEY, slug);
        else window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  };

  const host = typeof window !== "undefined" ? window.location.host : undefined;

  const query = useQuery({
    queryKey: ["current-tenant", slugOverride, host],
    queryFn: () =>
      getCurrentTenant({
        data: {
          ...(slugOverride ? { slug: slugOverride } : {}),
          ...(host ? { host } : {}),
        },
      }),
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo<Ctx>(
    () => ({
      tenant: (query.data as CurrentTenant | undefined) ?? null,
      loading: query.isLoading,
      slugOverride,
      setSlugOverride,
    }),
    [query.data, query.isLoading, slugOverride],
  );

  // Keep <html data-tenant="..."> in sync so CSS can theme per-store later.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const slug = (query.data as CurrentTenant | undefined)?.slug;
    if (slug) document.documentElement.setAttribute("data-tenant", slug);
  }, [query.data]);

  return <TenantCtx.Provider value={value}>{children}</TenantCtx.Provider>;
}

export function useCurrentTenant(): Ctx {
  const ctx = useContext(TenantCtx);
  if (!ctx) throw new Error("useCurrentTenant must be used inside <TenantProvider>");
  return ctx;
}
