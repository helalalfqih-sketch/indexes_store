import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldPersistHttpFailure } from "@/lib/monitoring/telemetry-policy";

const mocks = vi.hoisted(() => ({
  insert: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/integrations/supabase/client.server", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ insert: mocks.insert }),
  }),
}));

beforeEach(() => {
  mocks.insert.mockClear();
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_fixture");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("persistent telemetry egress policy", () => {
  it.each([
    [200, false],
    [302, false],
    [401, false],
    [404, false],
    [499, false],
    [500, true],
    [503, true],
    [599, true],
    [600, false],
  ])("classifies HTTP %i as persistent=%s", (status, expected) => {
    expect(shouldPersistHttpFailure(status)).toBe(expected);
  });

  it("drops info events, redacts sensitive fields, and deduplicates server failures", async () => {
    const { logServerError } = await import("@/services/live-logs.service");

    await logServerError({
      errorName: "request completed",
      level: "info",
      location: "/",
      cause: "HTTP 200 GET /",
    });
    expect(mocks.insert).not.toHaveBeenCalled();

    const report = {
      errorName: "checkout failure telemetry fixture",
      level: "error" as const,
      location: "/api/orders",
      cause: "Customer user@example.com used Bearer secret-token-value",
      context: { phone: "+967711111111", safe: "checkout" },
    };
    await logServerError(report);
    await logServerError(report);

    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const payload = mocks.insert.mock.calls[0]?.[0];
    expect(payload.cause).not.toContain("user@example.com");
    expect(JSON.stringify(payload.context)).not.toContain("+967711111111");
    expect(payload.cause).toContain("[EMAIL_REDACTED]");
  }, 15_000);

  it("serializes circular and bigint context without breaking error reporting", async () => {
    const { logServerError } = await import("@/services/live-logs.service");
    const context: Record<string, unknown> = { sequence: 1n };
    context.self = context;

    await expect(
      logServerError({
        errorName: "circular telemetry fixture",
        location: "/api/fixture",
        cause: "fixture failure",
        context,
      }),
    ).resolves.toBeUndefined();

    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const payload = mocks.insert.mock.calls[0]?.[0];
    expect(JSON.stringify(payload.context)).toContain("[Circular]");
    expect(JSON.stringify(payload.context)).toContain("1");
  });
});
