import { afterEach, describe, expect, it, vi } from "vitest";
import { createStoreDevelopmentAdapter } from "@/lib/mcp/store-development.server";

describe("store development adapter guardrails", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.STORE_MCP_GITHUB_TOKEN;
  });

  it("allows public source reads but reports writes blocked without a GitHub credential", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            default_branch: "main",
            private: false,
            html_url: "https://github.com/helalalfqih-sketch/indexes_store",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(adapter.repositoryInfo()).resolves.toMatchObject({
      repository: "helalalfqih-sketch/indexes_store",
      sourceReadConfigured: true,
      sourceReadMode: "public-github-api",
      sourceWriteConfigured: false,
      writeBlocker: "SOURCE_GITHUB_WRITE_NOT_CONFIGURED",
    });
  });

  it("rejects secret-like paths before making a GitHub request", async () => {
    process.env.STORE_MCP_GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(adapter.readFile(".env", "main")).rejects.toThrow("UNSAFE_PATH");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires an evidence signal before tracing an element to source", async () => {
    process.env.STORE_MCP_GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(adapter.traceElement({})).rejects.toThrow("TRACE_SIGNAL_REQUIRED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects PR inspection outside agent branches before GitHub access", async () => {
    process.env.STORE_MCP_GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(adapter.inspectPullRequest("main")).rejects.toThrow("UNSAFE_BRANCH");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires an exact commit SHA for release readiness", async () => {
    process.env.STORE_MCP_GITHUB_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const adapter = createStoreDevelopmentAdapter();
    await expect(
      adapter.releaseReadiness({ branch: "agent/test-change", expectedHeadSha: "abc" }),
    ).rejects.toThrow("EXPECTED_HEAD_SHA_REQUIRED");
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
    await expect(adapter.createBranch("feature/free-form", "main")).rejects.toThrow(
      "UNSAFE_BRANCH",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
