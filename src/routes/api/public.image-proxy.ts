import { createFileRoute } from "@tanstack/react-router";
import sharp from "sharp";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "cross-origin-resource-policy": "cross-origin",
};

export const Route = createFileRoute("/api/public/image-proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const source = requestUrl.searchParams.get("url") ?? "";
        const wStr = requestUrl.searchParams.get("w");
        const hStr = requestUrl.searchParams.get("h");
        const qStr = requestUrl.searchParams.get("q");

        const w = wStr ? parseInt(wStr, 10) : null;
        const h = hStr ? parseInt(hStr, 10) : null;
        const q = qStr ? parseInt(qStr, 10) : 80;

        try {
          const url = new URL(source);
          if (url.protocol !== "https:") {
            return new Response("Invalid image URL protocol", { status: 400, headers: CORS_HEADERS });
          }
        } catch {
          return new Response("Invalid image URL format", { status: 400, headers: CORS_HEADERS });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        try {
          const upstream = await fetch(source, {
            signal: controller.signal,
            headers: { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" },
          });
          if (!upstream.ok) {
            return new Response("Image not available", { 
              status: upstream.status || 502,
              headers: CORS_HEADERS
            });
          }

          const contentType = upstream.headers.get("content-type") || "image/jpeg";
          if (!contentType.startsWith("image/")) {
            return new Response("Unsupported media type", { status: 415, headers: CORS_HEADERS });
          }

          const arrayBuffer = await upstream.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Skip sharp processing for SVGs/GIFs to keep them vector-based / animated
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

          // Auto-detect best format based on Accept header
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

          // Sharp Pipeline
          let pipeline = sharp(buffer);

          // Resize
          if (w || h) {
            pipeline = pipeline.resize(w || undefined, h || undefined, {
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          // Compress & format conversion
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
        } catch (err) {
          console.error("Image proxy processing failed for URL:", source, err);
          // Graceful fallback to original image instead of failing
          try {
            const controllerFallback = new AbortController();
            const timeoutFallback = setTimeout(() => controllerFallback.abort(), 5_000);
            const fallbackFetch = await fetch(source, { signal: controllerFallback.signal });
            clearTimeout(timeoutFallback);
            if (fallbackFetch.ok && fallbackFetch.body) {
              const contentType = fallbackFetch.headers.get("content-type") || "image/jpeg";
              return new Response(fallbackFetch.body, {
                status: 200,
                headers: {
                  ...CORS_HEADERS,
                  "content-type": contentType,
                  "cache-control": "public, max-age=86400",
                },
              });
            }
          } catch (fallbackErr) {
            console.error("Fallback fetch also failed:", fallbackErr);
          }

          return new Response("Image proxy failed: " + (err instanceof Error ? err.message : String(err)), { 
            status: 502,
            headers: CORS_HEADERS
          });
        } finally {
          clearTimeout(timeout);
        }
      },
    },
  },
});