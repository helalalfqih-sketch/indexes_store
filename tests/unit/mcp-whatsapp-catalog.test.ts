import { describe, expect, it, vi } from "vitest";
import {
  getWhatsAppCatalogProduct,
  listWhatsAppCatalogCollectionProducts,
  listWhatsAppCatalogProducts,
} from "../../src/lib/mcp/whatsapp-catalog.server";
import { WHAPI_CHANNEL_ID, WHAPI_PHONE, WhapiError } from "../../src/lib/whapi.server";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function authorizedHealth(phone = WHAPI_PHONE) {
  return {
    channel_id: WHAPI_CHANNEL_ID,
    status: { code: 4, text: "AUTH" },
    user: { id: phone },
  };
}

describe("stable WhatsApp catalog reads", () => {
  it("validates the configured channel before reading a bounded product page", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(authorizedHealth()))
      .mockResolvedValueOnce(
        json({
          products: [{ id: "28712007088432374", name: "منتج اختبار" }],
          count: 1,
          total: 1,
          offset: 0,
        }),
      );

    const result = await listWhatsAppCatalogProducts(
      { count: 1, offset: 0 },
      { token: "test-token", fetcher },
    );

    expect(result).toMatchObject({ count: 1, total: 1 });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://gate.whapi.cloud/business/products?count=1&offset=0",
      expect.objectContaining({ method: "GET", redirect: "error", cache: "no-store" }),
    );
  });

  it("reads one exact catalog product ID only after the health check", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(authorizedHealth()))
      .mockResolvedValueOnce(json({ id: "28712007088432374", price: 14500, currency: "YER" }));

    const result = await getWhatsAppCatalogProduct("28712007088432374", {
      token: "test-token",
      fetcher,
    });

    expect(result).toMatchObject({ id: "28712007088432374", currency: "YER" });
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      "https://gate.whapi.cloud/business/products/28712007088432374",
      expect.any(Object),
    );
  });

  it("refuses catalog access when the connected WhatsApp number does not match Indexes", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(authorizedHealth("967700000000")));

    await expect(
      listWhatsAppCatalogProducts({ count: 1, offset: 0 }, { token: "test-token", fetcher }),
    ).rejects.toMatchObject<Partial<WhapiError>>({
      code: "WHAPI_PHONE_MISMATCH",
      status: 409,
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid collection IDs before any provider request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      listWhatsAppCatalogCollectionProducts("../../etc/passwd", 10, {
        token: "test-token",
        fetcher,
      }),
    ).rejects.toMatchObject<Partial<WhapiError>>({
      code: "INVALID_COLLECTION_ID",
      status: 400,
    });

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects unbounded product page sizes before any provider request", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      listWhatsAppCatalogProducts({ count: 500, offset: 0 }, { token: "test-token", fetcher }),
    ).rejects.toMatchObject<Partial<WhapiError>>({
      code: "INVALID_PAGINATION",
      status: 400,
    });

    expect(fetcher).not.toHaveBeenCalled();
  });
});
