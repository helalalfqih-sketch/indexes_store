import { describe, expect, it } from "vitest";
import {
  buildWhapiRuntimeMetadataRow,
  parseWhapiAccountsConfig,
} from "../../src/lib/whapi-accounts.functions";
import { parseWhapiPartnerChannels } from "../../src/lib/whapi-partner.server";

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

  it("builds provider-neutral Supabase metadata without storing provider credentials", () => {
    const row = buildWhapiRuntimeMetadataRow(
      "9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a",
      {
        id: "HAWKEY-KFHM7",
        displayName: "اندكس للتجارة",
        phone: "967771370740",
        state: "AUTH",
        isConnected: true,
        isLoggedIn: true,
      },
      "2026-09-30T12:00:00.000Z",
    );

    expect(row).toEqual({
      tenant_id: "9bfcf1a9-1ea7-4c1c-8d30-d48aeb56065a",
      provider: "whapi",
      channel_id: "HAWKEY-KFHM7",
      phone: "967771370740",
      display_name: "اندكس للتجارة",
      connection_state: "AUTH",
      authorized: true,
      last_seen_at: "2026-09-30T12:00:00.000Z",
      metadata: {
        runtime: "whapi",
        control_plane: "vercel",
      },
      updated_at: "2026-09-30T12:00:00.000Z",
    });
    expect(JSON.stringify(row)).not.toContain("token");
  });
  it("parses Whapi Partner channel listings without persisting tokens in account metadata", () => {
    expect(
      parseWhapiPartnerChannels({
        channels: [
          {
            id: "CHANNEL-KING",
            name: "الكنج",
            phone: "+967700000001",
            token: "server-channel-token",
          },
        ],
      }),
    ).toEqual([
      {
        id: "CHANNEL-KING",
        label: "الكنج",
        phone: "967700000001",
        token: "server-channel-token",
      },
    ]);
  });

});
