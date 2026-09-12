import { describe, expect, it } from "vitest";
import { disabledAiAgentResponse } from "@/routes/api/ai.agent";

describe("public AI engineering agent endpoint", () => {
  it("fails closed without parsing input or invoking privileged tools", async () => {
    const response = disabledAiAgentResponse();

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });
});
