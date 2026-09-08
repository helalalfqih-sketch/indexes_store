import { describe, expect, it } from "vitest";
import {
  isProxyableRasterContentType,
  normalizedMediaType,
} from "../../src/lib/security/image-proxy-content-type";

describe("image proxy content-type policy", () => {
  it("accepts raster image types", () => {
    expect(isProxyableRasterContentType("image/jpeg")).toBe(true);
    expect(isProxyableRasterContentType("image/png; charset=binary")).toBe(true);
    expect(isProxyableRasterContentType("image/webp")).toBe(true);
    expect(isProxyableRasterContentType("image/gif")).toBe(true);
  });

  it("rejects SVG and XML active content", () => {
    expect(isProxyableRasterContentType("image/svg+xml")).toBe(false);
    expect(isProxyableRasterContentType("IMAGE/SVG+XML; charset=utf-8")).toBe(false);
    expect(isProxyableRasterContentType("application/svg+xml")).toBe(false);
    expect(isProxyableRasterContentType("text/xml")).toBe(false);
  });

  it("rejects missing and non-image content types", () => {
    expect(isProxyableRasterContentType(null)).toBe(false);
    expect(isProxyableRasterContentType("text/html")).toBe(false);
    expect(normalizedMediaType(" IMAGE/PNG ; charset=utf-8")).toBe("image/png");
  });
});
