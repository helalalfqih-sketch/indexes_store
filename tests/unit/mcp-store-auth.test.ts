import { describe, expect, it } from "vitest";
import { selectStoreAdminTenant } from "@/lib/mcp/store-auth.server";

describe("store MCP tenant authorization", () => {
  it("binds an owner or manager to one exact tenant", () => {
    expect(selectStoreAdminTenant([{ id: "tenant-a" }], [])).toBe("tenant-a");
    expect(
      selectStoreAdminTenant([], [{ tenant_id: "tenant-b", role: "manager" }]),
    ).toBe("tenant-b");
  });

  it("deduplicates the same tenant across ownership and membership", () => {
    expect(
      selectStoreAdminTenant(
        [{ id: "tenant-a" }],
        [{ tenant_id: "tenant-a", role: "owner" }],
      ),
    ).toBe("tenant-a");
  });

  it("fails closed for non-admin membership or no tenant", () => {
    expect(() =>
      selectStoreAdminTenant([], [{ tenant_id: "tenant-a", role: "viewer" }]),
    ).toThrow("STORE_ADMIN_TENANT_NOT_FOUND");
    expect(() => selectStoreAdminTenant([], [])).toThrow("STORE_ADMIN_TENANT_NOT_FOUND");
  });

  it("fails closed instead of guessing when multiple tenants are administrable", () => {
    expect(() =>
      selectStoreAdminTenant(
        [{ id: "tenant-a" }],
        [{ tenant_id: "tenant-b", role: "manager" }],
      ),
    ).toThrow("STORE_ADMIN_TENANT_AMBIGUOUS");
  });
});
