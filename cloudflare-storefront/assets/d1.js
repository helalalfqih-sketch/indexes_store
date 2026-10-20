(() => {
  "use strict";
  const CART = "indexes_d1_cart_v1",
    FAVORITES = "indexes_favorites_v1";
  let timer,
    quoteSequence = 0;
  const status = (message) => {
    const node = document.getElementById("ix-status");
    node.textContent = message;
    clearTimeout(timer);
    timer = setTimeout(() => {
      node.textContent = "";
    }, 5000);
  };
  const read = (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data.slice(0, 50) : [];
    } catch {
      return [];
    }
  };
  const cart = () =>
    read(CART).filter(
      (i) =>
        i &&
        typeof i.id === "string" &&
        Number.isSafeInteger(i.quantity) &&
        i.quantity > 0 &&
        i.quantity <= 99,
    );
  const save = (items) => {
    try {
      localStorage.setItem(CART, JSON.stringify(items));
      updateCount();
    } catch {
      throw new Error("تعذر حفظ السلة. تحقق من إعدادات التخزين في المتصفح.");
    }
  };
  const updateCount = () =>
    document.querySelectorAll("[data-ix-cart-count]").forEach((node) => {
      node.textContent = cart().reduce((n, i) => n + i.quantity, 0);
    });
  const requestQuote = async (items) => {
    const response = await fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("تعذر مراجعة السلة مؤقتًا. حاول مجددًا.");
    }
    if (!response.ok) throw new Error(result.error || "تعذر مراجعة السلة. حاول مجددًا.");
    return result;
  };
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const image = (src, title) => {
    const img = element("img");
    img.src = src || "/assets/unavailable.svg";
    img.alt = title || "الصورة غير متاحة";
    img.loading = "lazy";
    return img;
  };
  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (img instanceof HTMLImageElement && !img.dataset.fallback) {
        img.dataset.fallback = "true";
        img.src = "/assets/unavailable.svg";
        img.srcset = "";
        img.alt = "الصورة غير متاحة";
      }
    },
    true,
  );
  // Also handle images which failed before this deferred script ran.
  document.querySelectorAll("img").forEach((img) => {
    if (img.complete && !img.naturalWidth) img.dispatchEvent(new Event("error"));
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!form.matches(".ix-mini-cart-form,.ix-product-actions")) return;
    event.preventDefault();
    const data = new FormData(form),
      id = String(data.get("id") || ""),
      quantity = Number(data.get("quantity"));
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)
      return status("اختر كمية صحيحة بين 1 و99.");
    const items = cart(),
      line = items.find((i) => i.id === id);
    if (line) line.quantity += quantity;
    else items.push({ id, quantity });
    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    try {
      const quote = await requestQuote(items);
      const selected = quote.items.find((i) => i.id === id);
      if (!selected?.available) throw new Error(selected?.reason || "هذا المنتج غير متاح حاليًا.");
      save(items);
      status("تمت الإضافة إلى السلة.");
    } catch (error) {
      status(error.message);
    } finally {
      button.disabled = false;
    }
  });
  document.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-ix-qty-minus],[data-ix-qty-plus]");
    if (quantityButton) {
      const input = quantityButton
        .closest(".ix-quantity__control")
        .querySelector("[data-ix-qty-input]");
      input.value = Math.max(
        1,
        Math.min(
          Number(input.max) || 99,
          (Number(input.value) || 1) + (quantityButton.hasAttribute("data-ix-qty-plus") ? 1 : -1),
        ),
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const share = event.target.closest("[data-ix-share]");
    if (share) {
      const url = share.dataset.ixShare;
      (navigator.share
        ? navigator.share({ url })
        : navigator.clipboard.writeText(url).then(() => status("تم نسخ رابط المنتج."))
      ).catch(() => status("تعذر مشاركة الرابط. يمكنك نسخه من شريط العنوان."));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const nav = document.querySelector("[data-ix-quicknav].is-open");
    if (nav) {
      nav.classList.remove("is-open");
      const button = document.querySelector("[data-ix-menu]");
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
  });

  const cartRoot = document.querySelector("[data-d1-cart]");
  const summary = document.querySelector("[data-d1-summary]");
  const send = document.querySelector("[data-d1-whatsapp]");
  async function renderCart(review = false) {
    if (!cartRoot) return;
    const ticket = ++quoteSequence;
    send.hidden = true;
    send.removeAttribute("href");
    const items = cart();
    if (!items.length) {
      cartRoot.replaceChildren(element("p", "سلة التسوق فارغة.", "ix-empty-state"));
      const link = element("a", "ابدأ التسوق", "ix-primary-link");
      link.href = "/collections/all";
      cartRoot.append(link);
      summary.hidden = true;
      return;
    }
    try {
      const quote = await requestQuote(items);
      if (ticket !== quoteSequence) return;
      cartRoot.replaceChildren();
      summary.hidden = false;
      for (const item of quote.items) {
        const article = element("article", undefined, "ix-cart-item");
        const link = element("a", undefined, "ix-cart-item__image");
        if (item.url) link.href = item.url;
        link.append(image(item.image, item.title));
        article.append(link);
        const body = element("div", undefined, "ix-cart-item__content");
        const title = element("a", item.title || "منتج غير متاح", "ix-cart-item__title");
        if (item.url) title.href = item.url;
        body.append(
          title,
          element("strong", item.price_label || ""),
          element("small", item.line_label ? `إجمالي المنتج: ${item.line_label}` : ""),
        );
        if (!item.available) body.append(element("p", item.reason, "ix-d1-error"));
        const controls = element("div", undefined, "ix-cart-item__controls");
        const input = element("input");
        input.type = "number";
        input.min = "1";
        input.max = String(Math.min(99, item.stock || 99));
        input.value = item.quantity;
        input.inputMode = "numeric";
        input.setAttribute("aria-label", `كمية ${item.title || "المنتج"}`);
        input.addEventListener("change", () => {
          const quantity = Number(input.value);
          if (!input.reportValidity() || !Number.isSafeInteger(quantity)) return;
          const next = cart().map((i) => (i.id === item.id ? { ...i, quantity } : i));
          try {
            save(next);
            renderCart();
          } catch (error) {
            status(error.message);
          }
        });
        const remove = element("button", "حذف");
        remove.type = "button";
        remove.setAttribute("aria-label", `حذف ${item.title || "المنتج"}`);
        remove.addEventListener("click", () => {
          try {
            save(cart().filter((i) => i.id !== item.id));
            renderCart();
          } catch (error) {
            status(error.message);
          }
        });
        controls.append(input, remove);
        body.append(controls);
        article.append(body);
        cartRoot.append(article);
      }
      const totals = document.querySelector("[data-d1-totals]");
      totals.replaceChildren();
      for (const total of quote.totals) {
        const row = element("div");
        row.append(element("dt", `المجموع (${total.currency})`), element("dd", total.label));
        totals.append(row);
      }
      const note = document.querySelector("[data-d1-cart-status]");
      note.textContent = quote.valid
        ? review
          ? "تمت مراجعة الأسعار والتوفر. يمكنك فتح الطلب في واتساب."
          : "راجع الأسعار والتوفر قبل فتح واتساب."
        : "عدّل أو احذف المنتجات غير المتاحة للمتابعة.";
      if (review && quote.valid) {
        send.href = quote.whatsapp_url;
        send.hidden = false;
      }
    } catch (error) {
      if (ticket !== quoteSequence) return;
      status(error.message);
      cartRoot.replaceChildren(element("p", "تعذر تحميل السلة.", "ix-empty-state"));
      const retry = element("button", "إعادة المحاولة", "ix-cart-update");
      retry.type = "button";
      retry.onclick = () => renderCart();
      cartRoot.append(retry);
      summary.hidden = true;
    }
  }
  document.querySelector("[data-d1-review]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await renderCart(true);
    } finally {
      button.disabled = false;
    }
  });

  let wishlistSequence = 0;
  async function wishlist() {
    const root = document.querySelector("[data-ix-wishlist-list]");
    if (!root) return;
    const ticket = ++wishlistSequence;
    const favorites = read(FAVORITES).filter((handle) => typeof handle === "string");
    if (!favorites.length) {
      root.replaceChildren(
        element("p", "لا توجد منتجات محفوظة في المفضلة على هذا الجهاز.", "ix-empty-state"),
      );
      return;
    }
    const results = await Promise.allSettled(
      favorites.map(async (handle) => {
        const response = await fetch(`/products/${encodeURIComponent(handle)}.js`);
        if (!response.ok) throw new Error("unavailable");
        return response.json();
      }),
    );
    if (ticket !== wishlistSequence) return;
    root.replaceChildren();
    for (let i = 0; i < results.length; i++) {
      const result = results[i],
        p = result.status === "fulfilled" ? result.value : null;
      const card = element("article", undefined, "ix-wishlist-card"),
        link = element("a");
      if (p) link.href = p.url;
      link.append(image(p?.featured_image, p?.title));
      const body = element("div", undefined, "ix-wishlist-card__body");
      const title = element("a", p?.title || "منتج محفوظ غير متاح حاليًا");
      if (p) title.href = p.url;
      body.append(title);
      if (p)
        body.append(
          element(
            "strong",
            new Intl.NumberFormat("ar-YE", {
              style: "currency",
              currency: p.currency,
              maximumFractionDigits: 2,
            }).format(p.price / 100),
          ),
        );
      const remove = element("button", "إزالة من المفضلة");
      remove.type = "button";
      remove.dataset.ixFavorite = favorites[i];
      remove.setAttribute("aria-pressed", "true");
      body.append(remove);
      card.append(link, body);
      root.append(card);
    }
  }
  document.addEventListener("indexes:favorites-changed", wishlist);
  addEventListener("storage", (event) => {
    if (event.key === CART) {
      updateCount();
      renderCart();
    }
    if (event.key === FAVORITES) wishlist();
  });
  updateCount();
  renderCart();
  wishlist();
})();
