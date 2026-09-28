import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatWhapiSelfSearchReply,
  searchWhapiCatalogProducts,
  sendWhapiSelfSearchText,
  shouldHandleWhapiSelfSearch,
  whapiSelfSearchChatId,
  WHAPI_SELF_CHAT_ID,
  WHAPI_SELF_SEARCH_REPLY_PREFIX,
  type WhapiCatalogSearchProduct,
} from "../../src/lib/whapi-self-search.server";
import { handleWhapiWebhook } from "../../src/lib/whapi-http.server";

const SECRET = "self-search-test-secret-12345678901234567890";

const product = (
  id: string,
  name: string,
  price: number,
  overrides: Partial<WhapiCatalogSearchProduct> = {},
): WhapiCatalogSearchProduct => ({
  id,
  name,
  description: name,
  price,
  currency: "YER",
  retailerId: null,
  reviewStatus: "APPROVED",
  url: null,
  ...overrides,
});

afterEach(() => {
  delete process.env.WHAPI_WEBHOOK_SECRET;
  delete process.env.WHAPI_SELF_SEARCH_PHONE;
  delete process.env.WHAPI_SELF_SEARCH_TOKEN;
  delete process.env.WHAPI_SELF_SEARCH_CHANNEL_ID;
});

describe("WhatsApp private self-chat catalog search", () => {
  it("matches by product name, price and product identifiers", () => {
    const catalog = [
      product("37899433306366495", "🧸 كرسي هزاز وعربة للاطفال الذكي", 36500, {
        retailerId: "42922671243349",
      }),
      product("28152861847656018", "مثبت هاتف ذكي ثلاثي المحاور", 29500),
      product("38064791606498653", "قاعدة متحركة للأجهزة المنزلية", 8500),
    ];

    expect(searchWhapiCatalogProducts(catalog, "كرسي هزاز")[0]?.id).toBe("37899433306366495");
    expect(searchWhapiCatalogProducts(catalog, "سعر 29500")[0]?.id).toBe("28152861847656018");
    expect(searchWhapiCatalogProducts(catalog, "42922671243349")[0]?.id).toBe("37899433306366495");
  });

  it("formats only current WhatsApp product IDs into wa.me links", () => {
    const reply = formatWhapiSelfSearchReply("كرسي", [
      product("37899433306366495", "🧸 كرسي هزاز", 36500),
    ]);
    expect(reply).toContain("36,500 ر.ي");
    expect(reply).toContain("✅ APPROVED");
    expect(reply).toContain("https://wa.me/p/37899433306366495/967771370740");
  });

  it("can target a separate linked WhatsApp account without changing catalog links", () => {
    process.env.WHAPI_SELF_SEARCH_PHONE = "967715158832";
    expect(whapiSelfSearchChatId()).toBe("967715158832@s.whatsapp.net");
    expect(
      shouldHandleWhapiSelfSearch({
        chatId: "967715158832@s.whatsapp.net",
        text: "كرسي هزاز",
      }),
    ).toBe(true);

    const reply = formatWhapiSelfSearchReply("كرسي", [
      product("37899433306366495", "🧸 كرسي هزاز", 36500),
    ]);
    expect(reply).toContain("https://wa.me/p/37899433306366495/967771370740");
  });

  it("accepts only the verified message-yourself chat and blocks reply loops", () => {
    expect(
      shouldHandleWhapiSelfSearch({
        chatId: WHAPI_SELF_CHAT_ID,
        text: "كرسي هزاز",
      }),
    ).toBe(true);
    expect(
      shouldHandleWhapiSelfSearch({
        chatId: "967700000001@s.whatsapp.net",
        text: "كرسي هزاز",
      }),
    ).toBe(false);
    expect(
      shouldHandleWhapiSelfSearch({
        chatId: WHAPI_SELF_CHAT_ID,
        text: `${WHAPI_SELF_SEARCH_REPLY_PREFIX} — بحث: كرسي`,
      }),
    ).toBe(false);
  });

  it("routes a newly persisted self-chat message to search exactly once", async () => {
    process.env.WHAPI_WEBHOOK_SECRET = SECRET;
    const selfSearch = vi.fn(async () => true);
    const request = new Request("https://example.test/api/webhooks/whapi", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-whapi-secret": SECRET,
      },
      body: JSON.stringify({
        messages: [
          {
            id: "self-query-1",
            chat_id: WHAPI_SELF_CHAT_ID,
            from_me: true,
            type: "text",
            text: { body: "كرسي هزاز" },
          },
        ],
      }),
    });

    const response = await handleWhapiWebhook(
      request,
      async () => new Set(["self-query-1"]),
      selfSearch,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, processed: 1 });
    expect(selfSearch).toHaveBeenCalledTimes(1);
    expect(selfSearch).toHaveBeenCalledWith({
      id: "self-query-1",
      chatId: WHAPI_SELF_CHAT_ID,
      text: "كرسي هزاز",
    });
  });

  it("does not answer a duplicate webhook delivery", async () => {
    process.env.WHAPI_WEBHOOK_SECRET = SECRET;
    const selfSearch = vi.fn(async () => true);
    const request = new Request("https://example.test/api/webhooks/whapi", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-whapi-secret": SECRET,
      },
      body: JSON.stringify({
        messages: [
          {
            id: "self-query-duplicate",
            chat_id: WHAPI_SELF_CHAT_ID,
            type: "text",
            text: { body: "كاميرا" },
          },
        ],
      }),
    });

    const response = await handleWhapiWebhook(request, async () => new Set(), selfSearch);

    expect(response.status).toBe(200);
    expect(selfSearch).not.toHaveBeenCalled();
  });

  it("sends self-search replies only to the fixed owner chat after health verification", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/health")) {
        return Response.json({
          channel_id: "HAWKEY-KFHM7",
          status: { code: 4, text: "AUTH" },
          user: { id: "967771370740" },
        });
      }
      return Response.json({
        sent: true,
        message: {
          id: "reply-message-1",
          chat_id: WHAPI_SELF_CHAT_ID,
        },
      });
    };

    await expect(
      sendWhapiSelfSearchText("🔎 اندكس — اختبار", {
        token: "test-token",
        fetcher,
      }),
    ).resolves.toEqual({ sent: true, messageId: "reply-message-1" });

    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toBe("https://gate.whapi.cloud/messages/text");
    expect(JSON.parse(String(calls[1]?.init?.body))).toMatchObject({
      to: WHAPI_SELF_CHAT_ID,
      body: "🔎 اندكس — اختبار",
    });
  });
});
