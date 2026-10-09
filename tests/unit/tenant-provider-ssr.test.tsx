import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentTenantMock } = vi.hoisted(() => ({
  getCurrentTenantMock: vi.fn(),
}));

vi.mock("@/lib/tenant.functions", () => ({
  getCurrentTenant: getCurrentTenantMock,
}));

import { TenantProvider } from "@/components/tenant-provider";

describe("TenantProvider SSR", () => {
  beforeEach(() => {
    getCurrentTenantMock.mockReset();
  });

  it("renders children without starting a duplicate tenant ServerFn request", () => {
    const queryClient = new QueryClient();

    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <TenantProvider>
          <main>storefront shell</main>
        </TenantProvider>
      </QueryClientProvider>,
    );

    expect(html).toContain("storefront shell");
    expect(getCurrentTenantMock).not.toHaveBeenCalled();
    expect(queryClient.isFetching()).toBe(0);
  });
});
