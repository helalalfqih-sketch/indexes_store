/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@astryxdesign/core", () => ({
  Theme: ({ mode, children }: { mode: string; children: ReactNode }) => (
    <div data-testid="astryx-theme" data-mode={mode}>
      {children}
    </div>
  ),
}));

import { useStorefrontTheme } from "@/components/storefront-theme-context";
import { StorefrontThemeProvider } from "@/components/storefront-theme-provider";

function ThemeControl() {
  const { mode, toggleMode } = useStorefrontTheme();
  return (
    <button type="button" onClick={toggleMode}>
      {mode}
    </button>
  );
}

describe("StorefrontThemeProvider", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("restores the saved mode and keeps Astryx and the document in sync", async () => {
    localStorage.setItem("indexes_store_theme", "dark");
    render(
      <StorefrontThemeProvider>
        <ThemeControl />
      </StorefrontThemeProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("astryx-theme").getAttribute("data-mode")).toBe("dark"),
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "dark" }));

    expect(screen.getByTestId("astryx-theme").getAttribute("data-mode")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("indexes_store_theme")).toBe("light");
  });
});
