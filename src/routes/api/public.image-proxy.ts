import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import sharp from "sharp";
import {
  isProxyableRasterContentType,
  normalizedMediaType,
} from "@/lib/security/image-proxy-content-type";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "cross-origin-resource-policy": "cross-origin",
  "x-content-type-options": "nosniff",
};

const MAX_SOURCE_URL_CHARS = 4_096;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 25_000_000;
const FETCH_TIMEOUT_MS = 8_000;
const DIMENSION_VARIANTS = [128, 384, 800, 1_200, 1_600] as const;
const QUALITY_VARIANTS = [25, 60, 80, 85] as const;
const PROXY_CACHE_CONTROL =
  "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400";
const REDIRECT_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400";
const FALLBACK_CACHE_CONTROL = "public, max-age=300, s-maxage=900";
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" rx="24" fill="#0c0a1a"/><rect x="2" y="2" width="296" height="296" rx="22" stroke="#7C3AED" stroke-opacity="0.3" stroke-width="2"/><circle cx="150" cy="135" r="50" fill="#7C3AED" fill-opacity="0.15" stroke="#A855F7" stroke-width="3"/><path d="M132 135L145 148L168 122" stroke="#22D3EE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="150" y="220" text-anchor="middle" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="14" font-weight="700">INDEXES</text></svg>`;

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "metadata.google.internal",
  "instance-data",
]);

type ImageFormat = "origin" | "avif" | "webp" | "jpeg" | "png";

export interface ImageVariant {
  width: number | null;
  height: number | null;
  quality: number;
  format: ImageFormat;
  requested: boolean;
}

export class ImagePayloadTooLargeError extends Error {
  constructor() {
    super("Image exceeds maximum allowed size");
    this.name = "ImagePayloadTooLargeError";
  }
}

function isPrivateIpOrHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (DISALLOWED_HOSTNAMES.has(host)) return true;

  if (/^10\./.test(host)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  if (/^224\./.test(host)) return true;
  if (/^240\./.test(host)) return true;
  if (host === "::1" || host === "fe80::" || host.startsWith("fd")) return true;

  return false;
}

function isDomainAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();
  const allowedSuffixes = [
    "supabase.co",
    "unsplash.com",
    "facebook.com",
    "fbcdn.net",
    "githubusercontent.com",
    "vercel.app",
    "indexes-store.com",
    "indexes-store.vercel.app",
    "firebasestorage.googleapis.com",
    "googleapis.com",
    "mux.com",
    "image.mux.com",
    "cloudinary.com",
    "imgix.net",
    "cdn.shopify.com",
  ];

  if (allowedSuffixes.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
    return true;
  }

  return (process.env.ALLOWED_IMAGE_DOMAINS?.split(",") ?? []).some((raw) => {
    const domain = raw.trim().toLowerCase();
    return domain.length > 0 && (host === domain || host.endsWith(`.${domain}`));
  });
}

function nearestVariant(value: number, variants: readonly number[]): number {
  return variants.reduce((best, candidate) =>
    Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
  );
}

function normalizedDimension(value: string | null, name: string): number | null {
  if (value === null) return null;
  if (!/^\d+$/.test(value)) throw new TypeError(`Invalid ${name}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new TypeError(`Invalid ${name}`);
  const bounded = Math.min(parsed, DIMENSION_VARIANTS[DIMENSION_VARIANTS.length - 1]);
  return DIMENSION_VARIANTS.find((candidate) => candidate >= bounded) ?? bounded;
}

function normalizedQuality(value: string | null): number {
  if (value === null) return 80;
  if (!/^\d+$/.test(value)) throw new TypeError("Invalid quality");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new TypeError("Invalid quality");
  }
  return nearestVariant(parsed, QUALITY_VARIANTS);
}

function normalizedFormat(value: string | null, requested: boolean): ImageFormat {
  if (value === null) return requested ? "webp" : "origin";
  const format = value.trim().toLowerCase() === "jpg" ? "jpeg" : value.trim().toLowerCase();
  if (["origin", "avif", "webp", "jpeg", "png"].includes(format)) {
    return format as ImageFormat;
  }
  throw new TypeError("Invalid image format");
}

export function normalizeImageVariant(searchParams: URLSearchParams): ImageVariant {
  const requested = ["w", "h", "q", "format"].some((key) => searchParams.has(key));
  return {
    width: normalizedDimension(searchParams.get("w"), "width"),
    height: normalizedDimension(searchParams.get("h"), "height"),
    quality: normalizedQuality(searchParams.get("q")),
    format: normalizedFormat(searchParams.get("format"), requested),
    requested,
  };
}

function canonicalProxyUrl(requestUrl: URL, source: URL, variant: ImageVariant): URL {
  const canonical = new URL(requestUrl.origin + requestUrl.pathname);
  canonical.searchParams.set("url", source.toString());
  if (variant.requested) {
    if (variant.width) canonical.searchParams.set("w", String(variant.width));
    if (variant.height) canonical.searchParams.set("h", String(variant.height));
    canonical.searchParams.set("q", String(variant.quality));
    canonical.searchParams.set("format", variant.format);
  }
  return canonical;
}

function isSupabaseStorageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "supabase.co" || host.endsWith(".supabase.co");
}

/**
 * Public Supabase objects already have a CDN and permissive image CORS headers.
 * Redirecting keeps the app server from downloading and re-uploading identical
 * bytes. Native transformations remain opt-in because they require a paid plan.
 */
export function getSupabasePublicImageTarget(
  source: URL,
  variant: ImageVariant,
  transformationsEnabled: boolean,
): URL | null {
  if (!isSupabaseStorageHost(source.hostname)) return null;

  const match = source.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/public\/(.+)$/);
  if (!match?.[1]) return null;

  const target = new URL(source.origin);
  target.hash = "";
  if (transformationsEnabled && variant.requested) {
    target.pathname = `/storage/v1/render/image/public/${match[1]}`;
    if (variant.width) target.searchParams.set("width", String(variant.width));
    if (variant.height) target.searchParams.set("height", String(variant.height));
    target.searchParams.set("quality", String(variant.quality));
    target.searchParams.set("resize", "contain");
    if (variant.format === "origin") target.searchParams.set("format", "origin");
  } else {
    target.pathname = `/storage/v1/object/public/${match[1]}`;
  }

  return target;
}

export async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (Number.isFinite(bytes) && bytes > maxBytes) throw new ImagePayloadTooLargeError();
  }

  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ImagePayloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function hashPathname(pathname: string): string {
  return crypto.createHash("sha256").update(pathname).digest("hex").substring(0, 16);
}

function fallbackResponse(): Response {
  return new Response(FALLBACK_SVG, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "content-type": "image/svg+xml",
      "cache-control": FALLBACK_CACHE_CONTROL,
    },
  });
}

function cacheHeaders(contentType: string): Record<string, string> {
  return {
    ...CORS_HEADERS,
    "content-type": contentType,
    "cache-control": PROXY_CACHE_CONTROL,
    "cdn-cache-control": PROXY_CACHE_CONTROL,
  };
}

function targetFormatFor(
  contentType: string,
  requested: ImageFormat,
): Exclude<ImageFormat, "origin"> {
  if (requested !== "origin") return requested;
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/avif") return "avif";
  return "jpeg";
}

export const Route = createFileRoute("/api/public/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const sourceValue = requestUrl.searchParams.get("url")?.trim() ?? "";
        if (!sourceValue || sourceValue.length > MAX_SOURCE_URL_CHARS) {
          return new Response("Invalid image URL", { status: 400, headers: CORS_HEADERS });
        }

        let source: URL;
        let variant: ImageVariant;
        try {
          source = new URL(sourceValue);
          variant = normalizeImageVariant(requestUrl.searchParams);
          if (source.protocol !== "https:" || source.username || source.password) {
            throw new TypeError("HTTPS URL required");
          }
        } catch {
          return new Response("Invalid image request", { status: 400, headers: CORS_HEADERS });
        }

        if (source.pathname.includes("/api/public/image-proxy")) {
          return new Response("Cannot proxy the image proxy itself", {
            status: 400,
            headers: CORS_HEADERS,
          });
        }
        if (isPrivateIpOrHost(source.hostname)) {
          return new Response("Private network addresses are restricted", {
            status: 403,
            headers: CORS_HEADERS,
          });
        }
        if (!isDomainAllowed(source.hostname)) {
          return new Response("Image host is not allowed", { status: 403, headers: CORS_HEADERS });
        }

        const supabaseTarget = getSupabasePublicImageTarget(
          source,
          variant,
          process.env.SUPABASE_IMAGE_TRANSFORMATIONS_ENABLED === "true",
        );
        if (supabaseTarget) {
          return new Response(null, {
            status: 307,
            headers: {
              ...CORS_HEADERS,
              location: supabaseTarget.toString(),
              "cache-control": REDIRECT_CACHE_CONTROL,
              "cdn-cache-control": REDIRECT_CACHE_CONTROL,
            },
          });
        }

        const canonicalUrl = canonicalProxyUrl(requestUrl, source, variant);
        if (requestUrl.search !== canonicalUrl.search) {
          return new Response(null, {
            status: 307,
            headers: {
              ...CORS_HEADERS,
              location: canonicalUrl.toString(),
              "cache-control": REDIRECT_CACHE_CONTROL,
            },
          });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const pathHash = hashPathname(source.pathname);

        try {
          const requestedAccept =
            variant.format === "origin" ? "image/*" : `image/${variant.format},image/*;q=0.8`;
          const upstream = await fetch(source, {
            signal: controller.signal,
            redirect: "error",
            headers: { accept: requestedAccept },
          });

          if (!upstream.ok) return fallbackResponse();

          const upstreamContentType = upstream.headers.get("content-type");
          if (!isProxyableRasterContentType(upstreamContentType)) {
            return new Response("Unsupported raster media type", {
              status: 415,
              headers: CORS_HEADERS,
            });
          }

          const contentType = normalizedMediaType(upstreamContentType);
          const input = await readResponseBodyWithLimit(upstream, MAX_IMAGE_BYTES);

          // Preserve original bytes when no variant was requested. This avoids
          // CPU-heavy re-encoding and produces one stable cache object per URL.
          if (!variant.requested || contentType === "image/gif") {
            const responseBody = input.buffer.slice(
              input.byteOffset,
              input.byteOffset + input.byteLength,
            ) as ArrayBuffer;
            return new Response(responseBody, {
              status: 200,
              headers: cacheHeaders(contentType),
            });
          }

          let pipeline = sharp(input, {
            failOn: "warning",
            limitInputPixels: MAX_IMAGE_PIXELS,
            sequentialRead: true,
          });
          if (variant.width || variant.height) {
            pipeline = pipeline.resize(variant.width ?? undefined, variant.height ?? undefined, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          const format = targetFormatFor(contentType, variant.format);
          if (format === "avif") pipeline = pipeline.avif({ quality: variant.quality });
          else if (format === "webp") pipeline = pipeline.webp({ quality: variant.quality });
          else if (format === "png") pipeline = pipeline.png({ quality: variant.quality });
          else pipeline = pipeline.jpeg({ quality: variant.quality, progressive: true });

          const output = await pipeline.toBuffer();
          if (output.byteLength > MAX_OUTPUT_IMAGE_BYTES) throw new ImagePayloadTooLargeError();

          return new Response(new Uint8Array(output), {
            status: 200,
            headers: cacheHeaders(`image/${format}`),
          });
        } catch (error: unknown) {
          if (error instanceof ImagePayloadTooLargeError) {
            return new Response("Image exceeds maximum allowed size (5MB)", {
              status: 413,
              headers: CORS_HEADERS,
            });
          }
          if (error instanceof Error && error.name === "AbortError") {
            return new Response("Image source request timed out", {
              status: 504,
              headers: { ...CORS_HEADERS, "cache-control": FALLBACK_CACHE_CONTROL },
            });
          }

          // A compact, non-PII diagnostic is enough for operational triage.
          console.error("[ImageProxy] processing_failed", {
            host: source.hostname,
            pathHash,
            kind: error instanceof Error ? error.name : "unknown",
          });
          return fallbackResponse();
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});
