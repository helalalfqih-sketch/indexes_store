const DEFAULT_PRODUCTION_ORIGIN = "https://indexes-store.vercel.app";

function cleanBasePath(baseUrl: string): string {
  const base = (baseUrl || "/").trim() || "/";
  if (!base.startsWith("/") || base.startsWith("//")) return "";
  return base === "/" ? "" : base.replace(/\/$/, "");
}

function isVercelPreviewHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host.endsWith(".vercel.app") && host !== "indexes-store.vercel.app";
}

export function resolveAuthRedirectUrl(input: {
  currentOrigin: string;
  baseUrl?: string;
  productionOrigin?: string;
}): string {
  const current = new URL(input.currentOrigin);
  const configured = new URL(input.productionOrigin?.trim() || DEFAULT_PRODUCTION_ORIGIN);

  if (configured.protocol !== "https:") {
    throw new Error("OAUTH_PRODUCTION_ORIGIN_MUST_BE_HTTPS");
  }

  const canonical =
    isVercelPreviewHost(configured.hostname) &&
    configured.hostname.toLowerCase() !== "indexes-store.vercel.app"
      ? new URL(DEFAULT_PRODUCTION_ORIGIN)
      : configured;

  const origin = isVercelPreviewHost(current.hostname) ? canonical.origin : current.origin;
  return `${origin}${cleanBasePath(input.baseUrl || "/")}/auth`;
}
