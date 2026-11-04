(() => {
  if (customElements.get("ix-card-gallery")) return;
  class CardGallery extends HTMLElement {
    connectedCallback() {
      if (this.bound) return;
      this.bound = true;
      this.index = 0;
      this.visible = false;
      this.hover = false;
      this.paused = false;
      this.link = this.querySelector("a");
      this.first = this.link?.querySelector("img");
      this.templates = [...this.querySelectorAll("template")];
      if (!this.first || !this.templates.length) return;
      this.abort = new AbortController();
      const opts = { signal: this.abort.signal };
      this.motion = matchMedia("(prefers-reduced-motion: reduce)");
      this.pauseButton = this.querySelector("[data-gallery-pause]");
      this.querySelector("[data-gallery-next]").addEventListener(
        "click",
        () => {
          this.paused = true;
          this.next();
          this.sync();
        },
        opts,
      );
      this.pauseButton.addEventListener(
        "click",
        () => {
          this.paused = !this.paused;
          this.sync();
        },
        opts,
      );
      this.addEventListener(
        "pointerenter",
        () => {
          this.hover = true;
          this.sync();
        },
        opts,
      );
      this.addEventListener(
        "pointerleave",
        () => {
          this.hover = false;
          this.sync();
        },
        opts,
      );
      this.addEventListener(
        "focusin",
        () => {
          this.focused = true;
          this.sync();
        },
        opts,
      );
      this.addEventListener(
        "focusout",
        (e) => {
          if (!this.contains(e.relatedTarget)) {
            this.focused = false;
            this.sync();
          }
        },
        opts,
      );
      document.addEventListener("visibilitychange", () => this.sync(), opts);
      this.motion.addEventListener("change", () => this.sync(), opts);
      this.observer = new IntersectionObserver(
        (entries) => {
          this.visible = entries[0].isIntersecting;
          this.sync();
        },
        { threshold: 0.4 },
      );
      this.observer.observe(this);
      this.sync();
    }
    next() {
      this.index = (this.index + 1) % (this.templates.length + 1);
      const image = this.index
        ? this.templates[this.index - 1].content.querySelector("img").cloneNode(true)
        : this.first.cloneNode(true);
      image.loading = "eager";
      this.link.querySelector("img").replaceWith(image);
      this.querySelector("[data-gallery-count]").textContent =
        `${this.index + 1} / ${this.templates.length + 1}`;
    }
    sync() {
      clearInterval(this.timer);
      const paused = this.paused || this.motion.matches;
      this.pauseButton.setAttribute("aria-pressed", String(paused));
      this.pauseButton.setAttribute(
        "aria-label",
        paused ? this.dataset.pausedLabel : this.dataset.playingLabel,
      );
      this.pauseButton.textContent = paused ? "▶" : "Ⅱ";
      if (this.visible && !paused && !this.hover && !this.focused && !document.hidden)
        this.timer = setInterval(() => this.next(), 4500);
    }
    disconnectedCallback() {
      clearInterval(this.timer);
      this.abort?.abort();
      this.observer?.disconnect();
      this.bound = false;
    }
  }
  customElements.define("ix-card-gallery", CardGallery);
})();
(() => {
  if (customElements.get("ix-hero-slider")) return;
  class HeroSlider extends HTMLElement {
    connectedCallback() {
      if (this.bound) return;
      this.bound = true;
      this.slides = [...this.querySelectorAll("[data-hero-slide]")];
      if (this.slides.length < 2) return;
      this.index = 0;
      this.paused = false;
      this.visible = true;
      this.focused = false;
      this.hover = false;
      this.abort = new AbortController();
      const options = { signal: this.abort.signal };
      this.motion = matchMedia("(prefers-reduced-motion: reduce)");
      this.controls = this.querySelector(".ix-hero-slider__controls");
      this.controls.hidden = false;
      this.button = this.querySelector("[data-hero-pause]");
      this.classList.add("is-enhanced");
      this.querySelector("[data-hero-next]").addEventListener(
        "click",
        () => this.move(1, true),
        options,
      );
      this.querySelector("[data-hero-prev]").addEventListener(
        "click",
        () => this.move(-1, true),
        options,
      );
      this.button.addEventListener(
        "click",
        () => {
          this.paused = !this.paused;
          this.sync();
        },
        options,
      );
      this.addEventListener(
        "keydown",
        (e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            this.move(e.key === "ArrowLeft" ? 1 : -1, true);
          }
        },
        options,
      );
      this.addEventListener(
        "pointerenter",
        () => {
          this.hover = true;
          this.sync();
        },
        options,
      );
      this.addEventListener(
        "pointerleave",
        () => {
          this.hover = false;
          this.sync();
        },
        options,
      );
      this.addEventListener(
        "focusin",
        () => {
          this.focused = true;
          this.sync();
        },
        options,
      );
      this.addEventListener(
        "focusout",
        (e) => {
          if (!this.contains(e.relatedTarget)) {
            this.focused = false;
            this.sync();
          }
        },
        options,
      );
      this.addEventListener(
        "touchstart",
        (e) => {
          this.touchX = e.touches[0].clientX;
        },
        { ...options, passive: true },
      );
      this.addEventListener(
        "touchend",
        (e) => {
          const delta = e.changedTouches[0].clientX - this.touchX;
          if (Math.abs(delta) > 45) this.move(delta > 0 ? 1 : -1, true);
        },
        { ...options, passive: true },
      );
      document.addEventListener("visibilitychange", () => this.sync(), options);
      this.motion.addEventListener("change", () => this.sync(), options);
      this.observer = new IntersectionObserver(
        (entries) => {
          this.visible = entries[0].isIntersecting;
          this.sync();
        },
        { threshold: 0.35 },
      );
      this.observer.observe(this);
      this.show();
      this.sync();
    }
    show() {
      this.slides.forEach((slide, n) => {
        slide.hidden = n !== this.index;
      });
      this.querySelector("[data-hero-count]").textContent =
        `${this.index + 1} / ${this.slides.length}`;
    }
    move(delta, manual = false) {
      this.index = (this.index + delta + this.slides.length) % this.slides.length;
      if (manual) this.paused = true;
      this.show();
      this.sync();
    }
    sync() {
      clearInterval(this.timer);
      const paused = this.paused || this.motion.matches;
      this.button.setAttribute(
        "aria-label",
        paused ? this.dataset.playLabel : this.dataset.pauseLabel,
      );
      this.button.setAttribute("aria-pressed", String(paused));
      this.button.textContent = paused ? "▶" : "Ⅱ";
      if (!paused && !this.focused && !this.hover && this.visible && !document.hidden)
        this.timer = setInterval(() => this.move(1), 5000);
    }
    disconnectedCallback() {
      clearInterval(this.timer);
      this.abort?.abort();
      this.observer?.disconnect();
      this.bound = false;
    }
  }
  customElements.define("ix-hero-slider", HeroSlider);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const header = e.target.closest(".ix-home-header");
    const nav = header?.querySelector("[data-ix-quicknav]");
    if (nav?.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      const button = header.querySelector("[data-ix-menu]");
      button.setAttribute("aria-expanded", "false");
      button.focus();
    }
  });
})();
