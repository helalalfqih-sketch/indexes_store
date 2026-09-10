// @vitest-environment jsdom
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useFavorites } from "../../src/lib/use-favorites";

function FavoriteCount() {
  const { favorites, toggleFavorite } = useFavorites();
  return (
    <button onClick={() => toggleFavorite("fixture-product")}>
      Favorites{favorites.length > 0 ? <span>{favorites.length}</span> : null}
    </button>
  );
}

describe("persisted favorites hydration", () => {
  let root: Root | undefined;
  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    root = undefined;
    localStorage.clear();
    document.body.replaceChildren();
  });

  it("hydrates the server's empty favorites before restoring browser favorites", async () => {
    localStorage.clear();
    const html = renderToString(<FavoriteCount />);
    localStorage.setItem("indexes_favorites", JSON.stringify(["fixture-product"]));
    const container = document.createElement("main");
    container.innerHTML = html;
    document.body.append(container);
    const errors: string[] = [];
    await act(async () => {
      root = hydrateRoot(container, <FavoriteCount />, {
        onRecoverableError: (error) => errors.push(String(error)),
      });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toBe("Favorites1");
    expect(JSON.parse(localStorage.getItem("indexes_favorites")!)).toEqual(["fixture-product"]);
    await act(async () => container.querySelector("button")!.click());
    expect(container.textContent).toBe("Favorites");
    expect(JSON.parse(localStorage.getItem("indexes_favorites")!)).toEqual([]);
  });
});
