import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  framework?: string;
  cleanUrls?: boolean;
  outputDirectory?: string;
  builds?: unknown[];
  rewrites?: Array<{ source?: string; destination?: string }>;
};

const config = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"),
) as VercelConfig;

describe("Vercel TanStack Start runtime contract", () => {
  it("uses the native TanStack Start framework adapter", () => {
    expect(config.framework).toBe("tanstack-start");
    expect(config.cleanUrls).toBe(true);
  });

  it("does not force static Vite output or a catch-all SPA rewrite", () => {
    expect(config.outputDirectory).toBeUndefined();
    expect(config.builds).toBeUndefined();
    expect(config.rewrites ?? []).not.toContainEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
