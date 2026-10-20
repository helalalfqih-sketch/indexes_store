(function () {
  var FAVORITES_KEY = "indexes_favorites_v1";
  // Keep the direct WhatsApp enquiry and discount display on the selected variant.
  function syncProduct(root) {
    if (!root) return;
    var select = root.querySelector("[data-ix-variant-select]");
    var option = select && select.selectedOptions[0];
    var quantityInput = root.querySelector("[data-ix-qty-input]");
    var quantity = Number(quantityInput && quantityInput.value);
    var link = root.querySelector(".ix-product-whatsapp");
    if (!link) return;
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      return;
    }
    var variantId = root.querySelector("[data-ix-variant-id]").value;
    var title = option ? option.dataset.title : root.dataset.ixVariant;
    var price = option ? option.dataset.price : root.dataset.ixPrice;
    var url = new URL(root.dataset.ixUrl);
    url.searchParams.set("variant", variantId);
    var d = root.dataset;
    var message = [
      d.ixGreeting + " " + d.ixTitle,
      d.ixVariantLabel + ": " + title,
      d.ixQuantityLabel + ": " + quantity,
      d.ixPriceLabel + ": " + price,
      d.ixCurrencyLabel + ": " + d.productCurrency,
      d.ixLinkLabel + ": " + url.href,
      d.ixConfirmation,
    ].join(" | ");
    link.href = "https://wa.me/967771370740?text=" + encodeURIComponent(message);
    link.removeAttribute("aria-disabled");
    if (option) {
      var amount = Number(option.dataset.rawPrice);
      var compare = Number(option.dataset.compare);
      var validSale =
        Number.isFinite(amount) && amount > 0 && Number.isFinite(compare) && compare > amount;
      var percent = validSale ? Math.round(((compare - amount) * 100) / compare) : 0;
      var oldPrice = root.querySelector("[data-ix-compare-price]");
      if (oldPrice) {
        oldPrice.hidden = !validSale;
        oldPrice.textContent = validSale ? option.dataset.compareFormatted : "";
      }
      root.querySelectorAll("[data-ix-sale-label],[data-ix-sale-badge]").forEach(function (badge) {
        badge.hidden = !validSale || percent === 0 || badge.dataset.hasNew === "true";
        badge.textContent = d.ixSaleTemplate.replace("__PERCENT__", String(percent));
      });
    }
  }

  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-ix-qty-input]"))
      syncProduct(event.target.closest("[data-ix-product]"));
  });
  document.addEventListener("click", function (event) {
    var link = event.target.closest(".ix-product-whatsapp");
    if (link && link.closest("[data-ix-product]")) {
      syncProduct(link.closest("[data-ix-product]"));
      if (!link.hasAttribute("href")) {
        event.preventDefault();
        link.closest("[data-ix-product]").querySelector("[data-ix-qty-input]").reportValidity();
      }
    }
    var cartLink = event.target.closest(".ix-cart-whatsapp");
    var form = cartLink && cartLink.closest(".ix-cart-form");
    if (
      form &&
      Array.from(form.querySelectorAll('input[name="updates[]"]')).some(function (input) {
        return input.value !== input.defaultValue;
      })
    ) {
      event.preventDefault();
      form.requestSubmit(form.querySelector('[name="update"]'));
    }
  });

  function readFavorites() {
    try {
      var value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (e) {
      return [];
    }
  }

  function writeFavorites(items) {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    } catch (e) {}
  }

  function refreshFavorites() {
    var items = readFavorites();
    document.querySelectorAll("[data-ix-favorite]").forEach(function (button) {
      var active = items.indexOf(button.getAttribute("data-ix-favorite")) > -1;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  document.addEventListener("click", function (event) {
    var menu = event.target.closest("[data-ix-menu]");
    if (menu) {
      var header = menu.closest(".ix-shell,.ix-home-header");
      var nav = header && header.querySelector("[data-ix-quicknav]");
      if (nav) {
        var open = nav.classList.toggle("is-open");
        menu.setAttribute("aria-expanded", open ? "true" : "false");
      }
      return;
    }

    var favorite = event.target.closest("[data-ix-favorite]");
    if (favorite) {
      var handle = favorite.getAttribute("data-ix-favorite");
      var items = readFavorites();
      var index = items.indexOf(handle);
      if (index > -1) {
        items.splice(index, 1);
      } else {
        items.push(handle);
      }
      writeFavorites(items);
      refreshFavorites();
      document.dispatchEvent(
        new CustomEvent("indexes:favorites-changed", { detail: { items: items } }),
      );
      return;
    }

    var thumb = event.target.closest("[data-ix-gallery-thumb]");
    if (thumb) {
      var gallery = thumb.closest("[data-ix-gallery]");
      if (!gallery) return;

      var index = thumb.getAttribute("data-index");
      var slides = gallery.querySelectorAll("[data-ix-gallery-slide]");
      if (slides.length) {
        slides.forEach(function (slide) {
          var active = slide.getAttribute("data-index") === index;
          slide.hidden = !active;
          slide.classList.toggle("is-active", active);

          if (!active) {
            slide.querySelectorAll("video").forEach(function (video) {
              try {
                video.pause();
              } catch (e) {}
            });
            slide.querySelectorAll("iframe").forEach(function (frame) {
              try {
                frame.contentWindow &&
                  frame.contentWindow.postMessage(
                    '{"event":"command","func":"pauseVideo","args":""}',
                    "*",
                  );
              } catch (e) {}
            });
          }
        });
      } else {
        var main = gallery.querySelector("[data-ix-gallery-main]");
        if (main) {
          main.src = thumb.getAttribute("data-src");
          main.alt = thumb.getAttribute("data-alt") || "";
        }
      }

      gallery.querySelectorAll("[data-ix-gallery-thumb]").forEach(function (el) {
        el.classList.toggle("is-active", el === thumb);
      });
    }
  });

  document.addEventListener("change", function (event) {
    var select = event.target.closest("[data-ix-variant-select]");
    if (!select) return;
    var option = select.options[select.selectedIndex];
    var root = select.closest("[data-ix-product]");
    var input = root && root.querySelector("[data-ix-variant-id]");
    var price = root && root.querySelector("[data-ix-product-price]");
    var add = root && root.querySelector("[data-ix-add-product]");
    if (input) input.value = option.value;
    if (price && option.dataset.price) price.textContent = option.dataset.price;
    syncProduct(root);
    if (add) {
      var priced = Number(option.dataset.rawPrice) > 0;
      var available = option.dataset.available === "true" && priced;
      add.disabled = !available;
      add.textContent = !priced
        ? "استفسر عن السعر عبر واتساب"
        : available
          ? "أضف إلى السلة"
          : "غير متوفر";
    }
  });

  document.addEventListener("submit", function (event) {
    var root = event.target.closest("[data-ix-product]");
    if (!root || !event.target.matches(".ix-product-actions")) return;
    var select = root.querySelector("[data-ix-variant-select]");
    var option = select && select.selectedOptions[0];
    var amount = Number(option ? option.dataset.rawPrice : root.dataset.ixRawPrice);
    if (!Number.isFinite(amount) || amount <= 0) event.preventDefault();
  });

  document.addEventListener("DOMContentLoaded", refreshFavorites);
  refreshFavorites();
})();
