import { describe, it, expect, vi } from "vitest";
import { checkTenantPermission } from "../users.functions";
import * as tenantContext from "../saas/tenant-context";

// Mock Supabase Client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null }),
};

vi.mock("../saas/tenant-context", () => ({
  resolveTenantId: vi.fn().mockResolvedValue("tenant-123"),
}));

describe("checkTenantPermission (Fail-Closed Authorization)", () => {
  it("should return false if no context is provided", async () => {
    const result = await checkTenantPermission("cms", null);
    expect(result).toBe(false);
  });

  it("should return false on exception instead of true (Fail-closed)", async () => {
    // Simulate an exception by throwing from the mock
    mockSupabase.from.mockImplementationOnce(() => {
      throw new Error("DB Connection Error");
    });
    
    const result = await checkTenantPermission("cms", { supabase: mockSupabase, userId: "user-1" });
    expect(result).toBe(false);
  });

  it("should return true if user is platform admin", async () => {
    mockSupabase.eq.mockResolvedValueOnce({ data: [{ role: "admin" }] }); // user_roles
    
    const result = await checkTenantPermission("cms", { supabase: mockSupabase, userId: "admin-1" });
    expect(result).toBe(true);
  });
});
