import { describe, expect, it, vi } from "vitest";
import {
  createSupabaseFetch,
  SUPABASE_UNAVAILABLE_CODE,
  SUPABASE_UNAVAILABLE_MESSAGE_AR,
} from "@/integrations/supabase/resilience";
import { mapAuthError } from "@/lib/auth-errors";

describe("Supabase quota resilience", () => {
  it("opens a per-origin circuit and sanitizes quota restriction responses", async () => {
    let currentTime = 1_000;
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          {
            message:
              "Service for this project is restricted due to the following violations: exceed_egress_quota.",
          },
          { status: 402 },
        ),
      )
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", {
      fetch: baseFetch,
      cooldownMs: 60_000,
      now: () => currentTime,
    });

    const first = await resilientFetch("https://restricted-fixture.supabase.co/rest/v1/products");
    expect(first.status).toBe(503);
    await expect(first.json()).resolves.toMatchObject({ code: SUPABASE_UNAVAILABLE_CODE });

    const second = await resilientFetch("https://restricted-fixture.supabase.co/auth/v1/token");
    expect(second.status).toBe(503);
    expect(second.headers.get("retry-after")).toBe("60");
    expect(baseFetch).toHaveBeenCalledTimes(1);

    currentTime += 60_001;
    const recovered = await resilientFetch(
      "https://restricted-fixture.supabase.co/rest/v1/products",
    );
    expect(recovered.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("preserves ordinary auth failures and applies opaque API key headers", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: "Invalid login credentials" }, { status: 400 }));
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", { fetch: baseFetch });
    const response = await resilientFetch("https://auth-fixture.supabase.co/auth/v1/token", {
      headers: { Authorization: "Bearer sb_publishable_fixture" },
    });

    expect(response.status).toBe(400);
    const headers = new Headers(baseFetch.mock.calls[0]?.[1]?.headers);
    expect(headers.get("apikey")).toBe("sb_publishable_fixture");
    expect(headers.get("authorization")).toBeNull();
  });

  it("bounds a stalled provider request without blocking the next request", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockImplementationOnce((_input, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      })
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", {
      fetch: baseFetch,
      timeoutMs: 5,
      cooldownMs: 60_000,
    });

    const timedOut = await resilientFetch(
      "https://timeout-fixture.supabase.co/rest/v1/storefront_settings",
    );
    expect(timedOut.status).toBe(503);
    await expect(timedOut.json()).resolves.toMatchObject({ code: SUPABASE_UNAVAILABLE_CODE });

    const followingResponse = await resilientFetch(
      "https://timeout-fixture.supabase.co/rest/v1/tenants",
    );
    expect(followingResponse.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("preserves an explicit caller abort instead of reporting a provider outage", async () => {
    const baseFetch = vi.fn<typeof fetch>().mockImplementation((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          "abort",
          () => reject(init.signal?.reason ?? new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      });
    });
    const controller = new AbortController();
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", {
      fetch: baseFetch,
      timeoutMs: 1_000,
    });
    const request = resilientFetch("https://caller-abort-fixture.supabase.co/rest/v1/products", {
      signal: controller.signal,
    });

    controller.abort(new DOMException("Navigation cancelled", "AbortError"));

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("does not open the provider circuit for an unrelated payment-required response", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ code: "PAYMENT_REQUIRED" }, { status: 402 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", { fetch: baseFetch });

    const paymentResponse = await resilientFetch(
      "https://business-fixture.supabase.co/functions/v1/checkout",
    );
    const followingResponse = await resilientFetch(
      "https://business-fixture.supabase.co/rest/v1/products",
    );

    expect(paymentResponse.status).toBe(402);
    expect(followingResponse.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("does not open the circuit when a normal database error echoes the quota token", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          {
            code: "22P02",
            message: 'invalid input syntax for type uuid: "exceed_egress_quota"',
          },
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", { fetch: baseFetch });

    const invalidInput = await resilientFetch(
      "https://echo-fixture.supabase.co/rest/v1/media_files?id=eq.exceed_egress_quota",
    );
    const followingResponse = await resilientFetch(
      "https://echo-fixture.supabase.co/rest/v1/products",
    );

    expect(invalidInput.status).toBe(400);
    expect(followingResponse.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("does not trust an unstructured 402 response", async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("exceed_egress_quota", { status: 402 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", { fetch: baseFetch });

    const unstructured = await resilientFetch(
      "https://text-fixture.supabase.co/functions/v1/custom",
    );
    const followingResponse = await resilientFetch(
      "https://text-fixture.supabase.co/rest/v1/products",
    );

    expect(unstructured.status).toBe(402);
    expect(followingResponse.status).toBe(200);
    expect(baseFetch).toHaveBeenCalledTimes(2);
  });

  it("recognizes egress quota among multiple structured restriction codes", async () => {
    const baseFetch = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          message:
            "Service for this project is restricted due to the following violations: database_size, exceed_egress_quota. Contact support for help.",
        },
        { status: 402 },
      ),
    );
    const resilientFetch = createSupabaseFetch("sb_publishable_fixture", { fetch: baseFetch });

    const response = await resilientFetch(
      "https://multi-restriction-fixture.supabase.co/rest/v1/products",
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ code: SUPABASE_UNAVAILABLE_CODE });
  });

  it("never exposes the provider quota message on the auth page", () => {
    expect(
      mapAuthError(
        new Error(
          "Service for this project is restricted due to the following violations: exceed_egress_quota.",
        ),
      ),
    ).toBe(SUPABASE_UNAVAILABLE_MESSAGE_AR);
    expect(mapAuthError(new Error("internal provider detail"))).toBe(
      "تعذّر إكمال العملية. حاول مرة أخرى بعد قليل.",
    );
  });
});
