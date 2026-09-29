import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyGowaStateAuthorization } from "@/lib/gowa-state.server";

describe("GOWA state gateway authentication", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts only the configured server-to-server Basic credential", () => {
    vi.stubEnv("GOWA_BASIC_AUTH", "admin:test-secret");

    const good = new Request("https://example.test/api/internal/gowa-state", {
      headers: {
        Authorization: `Basic ${Buffer.from("admin:test-secret").toString("base64")}`,
      },
    });
    const bad = new Request("https://example.test/api/internal/gowa-state", {
      headers: {
        Authorization: `Basic ${Buffer.from("admin:wrong").toString("base64")}`,
      },
    });

    expect(verifyGowaStateAuthorization(good)).toBe(true);
    expect(verifyGowaStateAuthorization(bad)).toBe(false);
  });

  it("fails closed when the server credential is missing", () => {
    vi.stubEnv("GOWA_BASIC_AUTH", "");
    expect(
      verifyGowaStateAuthorization(
        new Request("https://example.test/api/internal/gowa-state"),
      ),
    ).toBe(false);
  });
});
