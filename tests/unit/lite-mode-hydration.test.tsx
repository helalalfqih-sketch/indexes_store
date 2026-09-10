// @vitest-environment jsdom
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLiteMode } from "../../src/lib/liteMode";

function ConnectionStatus() {
  const { pref, isActive, isOffline } = useLiteMode();
  return <output>{`${pref}:${isActive}:${isOffline}`}</output>;
}

describe("Lite Mode hydration", () => {
  let root: Root | undefined;
  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    root = undefined;
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.replaceChildren();
  });

  it.each([
    { preference: "on", online: true, expected: "on:true:false" },
    { preference: "auto", online: false, expected: "auto:true:true" },
    { preference: "off", online: false, expected: "off:false:true" },
  ])(
    "restores $preference with online=$online after matching the server",
    async ({ preference, online, expected }) => {
      localStorage.clear();
      const network = vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      const html = renderToString(<ConnectionStatus />);
      expect(html).toContain("auto:false:false");
      localStorage.setItem("indexes_lite_mode_preference", preference);
      network.mockReturnValue(online);
      const container = document.createElement("main");
      container.innerHTML = html;
      document.body.append(container);
      const errors: string[] = [];
      await act(async () => {
        root = hydrateRoot(container, <ConnectionStatus />, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });
      expect(errors).toEqual([]);
      expect(container.textContent).toBe(expected);

      network.mockReturnValue(true);
      await act(async () => window.dispatchEvent(new Event("online")));
      expect(container.textContent).toBe(`${preference}:${preference === "on"}:false`);
    },
  );
});
