import { createFileRoute } from "@tanstack/react-router";
import sharp from "sharp";
import crypto from "crypto";
import { logServerError } from "@/services/live-logs.service";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "cross-origin-resource-policy": "cross-origin",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB limit

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254", // Cloud metadata service
  "metadata.google.internal",
  "instance-data",
]);

function isPrivateIpOrHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (DISALLOWED_HOSTNAMES.has(host)) return true;

  // IPv4 Private & Special Ranges
  if (/^10\./.test(host)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true; // Link-local
  if (/^224\./.test(host)) return true; // Multicast
  if (/^240\./.test(host)) return true; // Reserved

  // IPv6 Loopback/Local
  if (host === "::1" || host === "fe80::" || host.startsWith("fd")) return true;

  return false;
}

function isDomainAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase();

  // Explicit allowed host suffixes (strict host or dot-prefix matching)
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

  for (const domain of allowedSuffixes) {
    if (host === domain || host.endsWith("." + domain)) {
      return true;
    }
  }

  // Custom environment domains
  const customDomains = process.env.ALLOWED_IMAGE_DOMAINS?.split(",") || [];
  for (const raw of customDomains) {
    const d = raw.trim().toLowerCase();
    if (d && (host === d || host.endsWith("." + d))) {
      return true;
    }
  }

  return false;
}

function hashPathname(pathname: string): string {
  return crypto.createHash("sha256").update(pathname).digest("hex").substring(0, 16);
}

export const Route = createFileRoute("/api/public/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const source = requestUrl.searchParams.get("url") ?? "";
        const wStr = requestUrl.searchParams.get("w");
        const hStr = requestUrl.searchParams.get("h");
        const qStr = requestUrl.searchParams.get("q");

        // Bound parameters
        const w = wStr ? Math.min(Math.max(parseInt(wStr, 10) || 0, 1), 2000) : null;
        const h = hStr ? Math.min(Math.max(parseInt(hStr, 10) || 0, 1), 2000) : null;
        const rawQ = qStr ? parseInt(qStr, 10) : 80;
        const q = Math.min(Math.max(rawQ || 80, 10), 100);

        let parsedUrl: URL;
        try {
          parsedUrl = new URL(source);
          if (parsedUrl.protocol !== "https:") {
            return new Response("Invalid image URL protocol: HTTPS required", { status: 400, headers: CORS_HEADERS });
          }
        } catch {
          return new Response("Invalid image URL format", { status: 400, headers: CORS_HEADERS });
        }

        // Self-proxy rejection: Prevent recursive proxy requests
        if (parsedUrl.pathname.includes("/api/public/image-proxy")) {
          return new Response("Forbidden: Cannot proxy the image proxy itself", {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        // SSRF Check: Private IPs
        if (isPrivateIpOrHost(parsedUrl.hostname)) {
          console.warn("[ImageProxy] SSRF attempt blocked for host:", parsedUrl.hostname);
          return new Response("Forbidden: Access to private network addresses is restricted", {
            status: 403,
            headers: CORS_HEADERS,
          });
        }

        // Domain Allowlist Check (Strict match, no substring wildcard)
        if (!isDomainAllowed(parsedUrl.hostname)) {
          console.warn("[ImageProxy] Unauthorized image domain blocked:", parsedUrl.hostname);

          // ── Real error capture ───────────────────────────────────────────
          logServerError({
            errorName: `[ImageProxy] Unauthorized domain: ${parsedUrl.hostname}`,
            errorType: "Server Function",
            level: "warn",
            location: "/api/public/image-proxy",
            cause: `[ImageProxy] Unauthorized image domain blocked: ${parsedUrl.hostname}`,
            stackTrace: `HTTP 403 Forbidden\nGET /api/public/image-proxy\nBlocked hostname: ${parsedUrl.hostname}`,
            context: { method: "GET", status: 403, host: "indexes-store.vercel.app", blockedDomain: parsedUrl.hostname },
          }).catch(() => {});
          // ────────────────────────────────────────────────────────────────

          return new Response(`Forbidden: Host '${parsedUrl.hostname}' is not in the allowed domains list`, {
            status: 403,
            headers: CORS_HEADERS,
          });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        const pathHash = hashPathname(parsedUrl.pathname);

        try {
          // Log ONLY hostname, SHA-256 hash of pathname, and dimensions — NEVER full URL
          console.info("[IMAGE_PROXY]", {
            hostname: parsedUrl.hostname,
            pathnameHash: pathHash,
            width: w,
            height: h,
            quality: q,
          });

          const upstream = await fetch(source, {
            signal: controller.signal,
            redirect: "error", // Reject unverified redirects to prevent SSRF bypass
            headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
          });

          if (!upstream.ok) {
            console.warn(`[ImageProxy] Upstream returned HTTP ${upstream.status} for host: ${parsedUrl.hostname} (hash: ${pathHash})`);
            const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" rx="24" fill="#0c0a1a"/><rect x="2" y="2" width="296" height="296" rx="22" stroke="#7C3AED" stroke-opacity="0.3" stroke-width="2"/><circle cx="150" cy="135" r="50" fill="#7C3AED" fill-opacity="0.15" stroke="#A855F7" stroke-width="3"/><path d="M132 135L145 148L168 122" stroke="#22D3EE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="150" y="220" text-anchor="middle" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="14" font-weight="700">INDEXES</text></svg>`;
            return new Response(FALLBACK_SVG, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                "content-type": "image/svg+xml",
                "cache-control": "public, max-age=3600",
              },
            });
          }

          const contentLength = upstream.headers.get("content-length");
          if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
            return new Response("Image exceeds maximum allowed size (10MB)", { status: 413, headers: CORS_HEADERS });
          }

          const contentType = upstream.headers.get("content-type") || "image/jpeg";
          if (!contentType.startsWith("image/")) {
            return new Response("Unsupported media type", { status: 415, headers: CORS_HEADERS });
          }

          const arrayBuffer = await upstream.arrayBuffer();
          if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            return new Response("Image exceeds maximum allowed size (10MB)", { status: 413, headers: CORS_HEADERS });
          }

          const buffer = Buffer.from(arrayBuffer);

          // Skip sharp processing for SVGs/GIFs
          if (contentType.includes("svg") || contentType.includes("gif")) {
            return new Response(buffer, {
              status: 200,
              headers: {
                ...CORS_HEADERS,
                "content-type": contentType,
                "cache-control": "public, max-age=31536000, immutable",
              },
            });
          }

          // Format detection based on Accept header
          const acceptHeader = request.headers.get("accept") || "";
          let format: "avif" | "webp" | "jpeg" | "png" = "jpeg";
          let targetContentType = "image/jpeg";

          if (acceptHeader.includes("image/avif")) {
            format = "avif";
            targetContentType = "image/avif";
          } else if (acceptHeader.includes("image/webp")) {
            format = "webp";
            targetContentType = "image/webp";
          } else if (contentType.includes("png")) {
            format = "png";
            targetContentType = "image/png";
          }

          let pipeline = sharp(buffer);

          if (w || h) {
            pipeline = pipeline.resize(w || undefined, h || undefined, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          if (format === "avif") {
            pipeline = pipeline.avif({ quality: q });
          } else if (format === "webp") {
            pipeline = pipeline.webp({ quality: q });
          } else if (format === "png") {
            pipeline = pipeline.png({ quality: q });
          } else {
            pipeline = pipeline.jpeg({ quality: q, progressive: true });
          }

          const outputBuffer = await pipeline.toBuffer();

          return new Response(outputBuffer, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              "content-type": targetContentType,
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch (err: any) {
          if (err instanceof DOMException && err.name === "AbortError") {
            console.warn(`[ImageProxy] Upstream request timed out for host: ${parsedUrl.hostname} (hash: ${pathHash})`);
            return new Response("Image source request timed out", {
              status: 504,
              headers: { ...CORS_HEADERS, "cache-control": "public, s-maxage=60" },
            });
          }

          console.error(`[ImageProxy] Processing error for host: ${parsedUrl.hostname} (hash: ${pathHash})`);

          // ── Real error capture ───────────────────────────────────────────
          logServerError({
            errorName: `[ImageProxy] Processing Error`,
            errorType: "Server Function",
            level: "error",
            location: "/api/public/image-proxy",
            cause: `Processing failed for host ${parsedUrl.hostname}: ${(err as any)?.message || String(err)}`,
            stackTrace: (err as any)?.stack || String(err),
            context: { method: "GET", status: 502, host: "indexes-store.vercel.app", blockedDomain: parsedUrl.hostname },
          }).catch(() => {});
          // ────────────────────────────────────────────────────────────────

          const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" fill="none"><rect width="300" height="300" rx="24" fill="#0c0a1a"/><rect x="2" y="2" width="296" height="296" rx="22" stroke="#7C3AED" stroke-opacity="0.3" stroke-width="2"/><circle cx="150" cy="135" r="50" fill="#7C3AED" fill-opacity="0.15" stroke="#A855F7" stroke-width="3"/><path d="M132 135L145 148L168 122" stroke="#22D3EE" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="150" y="220" text-anchor="middle" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="14" font-weight="700">INDEXES</text></svg>`;
          return new Response(FALLBACK_SVG, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              "content-type": "image/svg+xml",
              "cache-control": "public, max-age=3600",
            },
          });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});
