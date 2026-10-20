(() => {
  if (window.ixPredictiveBound) return;
  window.ixPredictiveBound = true;
  function init(w) {
    if (w.dataset.p === "1") return;
    w.dataset.p = "1";
    const i = w.querySelector("[data-ix-predictive-input]"),
      o = w.querySelector("[data-ix-predictive-results]");
    if (!i || !o) return;
    const labels = JSON.parse(document.getElementById("ix-search-labels")?.textContent || "{}");
    let timer,
      controller,
      sequence = 0,
      active = -1;
    const root = window.Shopify?.routes?.root || "/";
    const hide = () => {
      o.hidden = true;
      o.replaceChildren();
      i.setAttribute("aria-expanded", "false");
      i.removeAttribute("aria-activedescendant");
      active = -1;
    };
    const option = (text, url) => {
      const a = document.createElement("a");
      a.className = "ix-predictive__item";
      a.href = url;
      a.textContent = text;
      a.id = o.id + "-" + o.children.length;
      a.setAttribute("role", "option");
      a.setAttribute("aria-selected", "false");
      o.append(a);
    };
    i.addEventListener("input", () => {
      clearTimeout(timer);
      controller?.abort();
      const ticket = ++sequence,
        q = i.value.trim();
      hide();
      if (q.length < 2) return;
      timer = setTimeout(async () => {
        controller = new AbortController();
        i.setAttribute("aria-busy", "true");
        try {
          const url = new URL(root + "search/suggest.json", location.origin);
          url.search = new URLSearchParams({
            q,
            "resources[type]": "product,collection",
            "resources[limit]": "8",
          }).toString();
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          });
          if (!response.ok) throw new Error("search");
          const data = await response.json();
          if (ticket !== sequence || i.value.trim() !== q) return;
          const result = data.resources?.results || {},
            seen = new Set();
          o.replaceChildren();
          for (const item of [...(result.products || []), ...(result.collections || [])]) {
            if (!item.url || !item.title) continue;
            const u = new URL(item.url, location.origin);
            if (u.origin !== location.origin) continue;
            const key = u.pathname;
            if (seen.has(key)) continue;
            seen.add(key);
            option(item.title, u.pathname + u.search);
          }
          if (!seen.size) {
            const p = document.createElement("p");
            p.textContent = labels.empty;
            o.append(p);
          }
        } catch (error) {
          if (error.name === "AbortError" || ticket !== sequence) return;
          o.replaceChildren();
          const p = document.createElement("p");
          p.textContent = labels.error;
          o.append(p);
        } finally {
          if (ticket === sequence) i.removeAttribute("aria-busy");
        }
        if (ticket !== sequence) return;
        option(labels.all, root + "search?" + new URLSearchParams({ q, type: "product" }));
        o.hidden = false;
        i.setAttribute("aria-expanded", "true");
      }, 220);
    });
    i.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        sequence++;
        controller?.abort();
        clearTimeout(timer);
        hide();
        return;
      }
      const options = [...o.querySelectorAll("[role=option]")];
      if (o.hidden || !options.length) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        active = (active + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options.forEach((a, n) => a.setAttribute("aria-selected", String(n === active)));
        i.setAttribute("aria-activedescendant", options[active].id);
      }
      if (event.key === "Enter" && active >= 0) {
        event.preventDefault();
        options[active].click();
      }
    });
    document.addEventListener("click", (event) => {
      if (!w.contains(event.target)) {
        sequence++;
        controller?.abort();
        clearTimeout(timer);
        hide();
      }
    });
    w.querySelector("form")?.addEventListener("submit", () => {
      sequence++;
      controller?.abort();
      clearTimeout(timer);
      hide();
    });
  }
  const scan = () => document.querySelectorAll("[data-ix-predictive-wrap]").forEach(init);
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", scan, { once: true });
  else scan();
  document.addEventListener("shopify:section:load", scan);
})();
