const DEFAULT_PRODUCTION_ORIGIN = "https://indexes-store.vercel.app";

function cleanBasePath(baseUrl: string): string {
  const base = (baseUrl || "/").trim() || "/";
  if (!base.startsWith("/")) return "";
  return base === "/" ? "" : base.replace(/\/$/, "");
}

export function resolveAuthRedirectUrl(input: {
  currentOrigin: string;
  baseUrl?: string;
  productionOrigin?: string;
}): string {
  const current = new URL(input.currentOrigin);
  const configuredProduction =
    input.productionOrigin?.trim() || DEFAULT_PRODUCTION_ORIGIN;
  const production = new URL(configuredProduction);

  if (production.protocol !== "https:") {
    throw new Error("OAUTH_PRODUCTION_ORIGIN_MUST_BE_HTTPS");
  }

  const host = current.hostname.toLowerCase();
  const isVercelPreview =
    host.endsWith(".vercel.app") &&
    host !== "indexes-store.vercel.app";

  const origin = isVercelPreview ? production.origin : current.origin;
  return `${origin}${cleanBasePath(input.baseUrl || "/")}/auth`;
}
