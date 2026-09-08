const BLOCKED_IMAGE_CONTENT_TYPES = new Set([
  "image/svg+xml",
  "application/svg+xml",
  "text/xml",
  "application/xml",
]);

export function normalizedMediaType(contentType: string | null | undefined): string {
  return (contentType || "").split(";", 1)[0].trim().toLowerCase();
}

/**
 * Only raster image payloads may be returned through the same-origin proxy.
 * SVG/XML is active document content and must never be forwarded verbatim.
 */
export function isProxyableRasterContentType(contentType: string | null | undefined): boolean {
  const mediaType = normalizedMediaType(contentType);
  return mediaType.startsWith("image/") && !BLOCKED_IMAGE_CONTENT_TYPES.has(mediaType);
}
