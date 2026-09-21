import { afterEach, describe, expect, it, vi } from "vitest";
import { createStoreDevelopmentAdapter } from "@/lib/mcp/store-development.server";

describe("store development adapter guardrails", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.STORE_MCP_GITHUB_TOKEN;
  });

  it("fails closed when the server-side GitHub credential is not configured", async () => {
    const adapter = createStoreDevelopmentAdapter();
    await expect(adapter.repositoryInfo()).rejects.toThrow("STORE_MCP_GITHUB_NOT_CONFIGURED");
  });

  it("rejects secret-like paths before making a GitHub request", async () => {
    process.env.STORE_MCP_GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(adapter.readFile(".env", "main")).rejects.toThrow("UNSAFE_PATH");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects direct main writes and non-agent branches", async () => {
    process.env.STORE_MCP_GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(
      adapter.patchFile({
        branch: "main",
        path: "src/app.tsx",
        expectedSha: "abc",
        content: "export {};",
        message: "test",
      }),
    ).rejects.toThrow("UNSAFE_BRANCH");
    await expect(adapter.createBranch("feature/free-form", "main")).rejects.toThrow("UNSAFE_BRANCH");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
