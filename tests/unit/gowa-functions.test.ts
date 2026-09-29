import { describe, expect, it } from "vitest";
import { normalizeGowaQrUrl, parseGowaDevices } from "../../src/lib/gowa.functions";

describe("GOWA account parsing", () => {
  it("maps the REST device envelope into stable admin account records", () => {
    expect(
      parseGowaDevices({
        status: 200,
        code: "SUCCESS",
        results: [
          {
            id: "indexes",
            display_name: "اندكس للتجارة",
            jid: "967771370740@s.whatsapp.net",
            state: "connected",
            created_at: "2026-09-29T17:00:00Z",
          },
        ],
      }),
    ).toEqual([
      {
        id: "indexes",
        displayName: "اندكس للتجارة",
        jid: "967771370740@s.whatsapp.net",
        state: "connected",
        createdAt: "2026-09-29T17:00:00Z",
      },
    ]);
  });

  it("drops malformed rows instead of inventing a device id", () => {
    expect(
      parseGowaDevices({
        results: [null, {}, { display_name: "missing-id" }, { id: "king", state: "disconnected" }],
      }),
    ).toEqual([
      {
        id: "king",
        displayName: "",
        jid: "",
        state: "disconnected",
        createdAt: null,
      },
    ]);
  });

  it("returns an empty list for unexpected provider payloads", () => {
    expect(parseGowaDevices({ results: null })).toEqual([]);
    expect(parseGowaDevices("invalid")).toEqual([]);
  });
});


describe("GOWA QR URL normalization", () => {
  it("upgrades a same-host Render proxy http QR link to the configured https origin", () => {
    const url = normalizeGowaQrUrl(
      "http://indexes-whatsapp-mcp.onrender.com/statics/qrcode/device.png?token=abc",
      "https://indexes-whatsapp-mcp.onrender.com",
    );

    expect(url.toString()).toBe(
      "https://indexes-whatsapp-mcp.onrender.com/statics/qrcode/device.png?token=abc",
    );
  });

  it("rejects QR links that point at a different host", () => {
    expect(() =>
      normalizeGowaQrUrl(
        "https://attacker.example/statics/qrcode/device.png",
        "https://indexes-whatsapp-mcp.onrender.com",
      ),
    ).toThrow("GOWA_QR_ORIGIN_MISMATCH");
  });
});
