// @vitest-environment jsdom
import React, { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useCart, useHydrateCart } from "../../src/lib/cart-store";

function CartCount() {
  const items = useCart((state) => state.items);
  const count = items.reduce((total, item) => total + item.qty, 0);
  return <button>Cart{count > 0 ? <span>{count}</span> : null}</button>;
}

function App() {
  useHydrateCart();
  return <CartCount />;
}

describe("persisted cart hydration", () => {
  let root: Root | undefined;

  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    root = undefined;
    useCart.setState({ items: [] });
    localStorage.clear();
    document.body.replaceChildren();
  });

  it.each([false, true])(
    "hydrates the server snapshot with storage already restored=%s",
    async (alreadyRestored) => {
      useCart.setState({ items: [] });
      localStorage.clear();
      const html = renderToString(<App />);
      localStorage.setItem(
        "noqta-cart-v2",
        JSON.stringify({
          state: {
            items: [
              {
                productId: "fixture-product",
                name: "Fixture",
                price: 1000,
                image: "/fixture.jpg",
                qty: 2,
              },
            ],
          },
          version: 0,
        }),
      );

      if (alreadyRestored) await useCart.persist.rehydrate();

      const container = document.createElement("main");
      container.innerHTML = html;
      document.body.append(container);
      const errors: string[] = [];

      await act(async () => {
        root = hydrateRoot(container, <App />, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });

      expect(errors).toEqual([]);
      expect(container.textContent).toBe("Cart2");
    },
  );
});
