import { describe, expect, it } from "vitest";
import { parseWhapiAccountsConfig } from "../../src/lib/whapi-accounts.functions";

describe("Whapi account configuration", () => {
  it("parses multiple server-side token references without accepting raw tokens", () => {
    expect(
      parseWhapiAccountsConfig(
        JSON.stringify([
          {
            id: "HAWKEY-KFHM7",
            label: "اندكس للتجارة",
            phone: "967771370740",
            tokenEnv: "WHAPI_TOKEN",
          },
          {
            id: "KING-CHANNEL",
            label: "الكنج",
            phone: "967700000001",
            tokenEnv: "WHAPI_TOKEN_KING",
          },
        ]),
        true,
      ),
    ).toEqual([
      {
        id: "HAWKEY-KFHM7",
        label: "اندكس للتجارة",
        phone: "967771370740",
        tokenEnv: "WHAPI_TOKEN",
      },
      {
        id: "KING-CHANNEL",
        label: "الكنج",
        phone: "967700000001",
        tokenEnv: "WHAPI_TOKEN_KING",
      },
    ]);
  });

  it("rejects token references that are not approved server environment names", () => {
    expect(() =>
      parseWhapiAccountsConfig(
        JSON.stringify([
          {
            id: "indexes",
            label: "اندكس",
            phone: "967771370740",
            tokenEnv: "raw-provider-token",
          },
        ]),
        true,
      ),
    ).toThrow();
  });

  it("returns no accounts when neither JSON nor the primary Whapi token is configured", () => {
    expect(parseWhapiAccountsConfig(undefined, false)).toEqual([]);
  });
});
