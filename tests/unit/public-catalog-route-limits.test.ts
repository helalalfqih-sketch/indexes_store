import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listProductsInput } from "@/lib/actions/product.actions";

const routeSource = (filename: string) =>
  readFileSync(resolve(process.cwd(), "src/routes", filename), "utf8");

describe("public catalog route limits", () => {
  it("keeps the Merchant feed request within the validated product limit", () => {
    expect(listProductsInput.safeParse({ limit: 100 }).success).toBe(true);
    expect(routeSource("google-shopping[.]xml.ts")).toContain("fetchProducts({ limit: 100 })");
  });

  it("keeps the sitemap request within the validated product limit", () => {
    expect(listProductsInput.safeParse({ limit: 500 }).success).toBe(false);
    expect(routeSource("sitemap[.]xml.ts")).toContain("fetchProducts({ limit: 100 })");
  });
});
