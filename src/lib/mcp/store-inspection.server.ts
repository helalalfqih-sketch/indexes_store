const STORE_ORIGIN = "https://indexes-store.vercel.app";
const MAX_HTML_BYTES = 1_500_000;
const MAX_LINKS = 300;
const MAX_ELEMENTS = 500;

function allowedUrl(value: string) {
  const url = new URL(value, STORE_ORIGIN);
  if (url.origin !== STORE_ORIGIN || !["http:", "https:"].includes(url.protocol)) {
    throw new Error("SITE_URL_FORBIDDEN");
  }
  return url;
}

function text(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function attrs(source: string) {
  return Object.fromEntries(
    [...source.matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+)))?/g)].map(
      (match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ""],
    ),
  );
}

function extractElements(html: string) {
  const elements: Array<Record<string, unknown>> = [];
  const pattern = /<(a|button|form|input|select|textarea)\b([^>]*)>([\s\S]*?)<\/\1>|<(input)\b([^>]*)\/?\s*>/gi;
  for (const match of html.matchAll(pattern)) {
    if (elements.length >= MAX_ELEMENTS) break;
    const tag = (match[1] || match[4] || "").toLowerCase();
    const rawAttrs = match[2] || match[5] || "";
    const attributes = attrs(rawAttrs);
    elements.push({
      tag,
      id: attributes.id || null,
      name: attributes.name || null,
      type: attributes.type || null,
      href: attributes.href || null,
      action: attributes.action || null,
      method: attributes.method || null,
      ariaLabel: attributes["aria-label"] || null,
      disabled: Object.hasOwn(attributes, "disabled"),
      text: tag === "input" ? attributes.value || attributes.placeholder || "" : text(match[3] || ""),
    });
  }
  return elements;
}

function pageSignals(html: string) {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "";
  const description =
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i.exec(html)?.[1] ??
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i.exec(html)?.[1] ??
    "";
  const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) =>
    text(match[1].replace(/<[^>]+>/g, " ")),
  );
  const images = [...html.matchAll(/<img\b([^>]*)>/gi)].slice(0, MAX_ELEMENTS).map((match) => {
    const attributes = attrs(match[1]);
    return {
      src: attributes.src || null,
      alt: attributes.alt || "",
      missingAlt: !attributes.alt?.trim(),
    };
  });
  return {
    title: text(title.replace(/<[^>]+>/g, " ")),
    description: text(description),
    h1,
    images,
    missingAltImages: images.filter((image) => image.missingAlt).length,
  };
}

async function fetchHtml(url: URL) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "IndexesStoreControlPlane/2.0",
    },
    redirect: "follow",
  });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) throw new Error(`SITE_HTTP_${response.status}`);
  if (!contentType.includes("text/html")) throw new Error("SITE_NOT_HTML");
  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new Error("SITE_HTML_TOO_LARGE");
  return { html, status: response.status, finalUrl: response.url };
}

export interface StoreInspectionAdapter {
  inspectPage(url: string): Promise<Record<string, unknown>>;
  inspectNavigation(url: string): Promise<Record<string, unknown>>;
  inspectForms(url: string): Promise<Record<string, unknown>>;
  inspectMobileUi(url: string): Promise<Record<string, unknown>>;
  inspectSite(startUrl: string, limit: number): Promise<Record<string, unknown>>;
}

export function createStoreInspectionAdapter(): StoreInspectionAdapter {
  return {
    async inspectPage(value) {
      const url = allowedUrl(value);
      const started = Date.now();
      const { html, status, finalUrl } = await fetchHtml(url);
      const elements = extractElements(html);
      const signals = pageSignals(html);
      return {
        url: url.toString(),
        finalUrl,
        status,
        responseMs: Date.now() - started,
        ...signals,
        interactiveElements: elements,
        elementCount: elements.length,
        issues: [
          !signals.title ? "missing_title" : null,
          !signals.description ? "missing_meta_description" : null,
          signals.h1.length === 0 ? "missing_h1" : null,
          signals.h1.length > 1 ? "multiple_h1" : null,
          signals.missingAltImages > 0 ? "images_missing_alt" : null,
        ].filter(Boolean),
        inspectionMode: "read-only-http",
      };
    },

    async inspectNavigation(value) {
      const url = allowedUrl(value);
      const { html } = await fetchHtml(url);
      const links = extractElements(html)
        .filter((element) => element.tag === "a" && typeof element.href === "string" && element.href)
        .slice(0, MAX_LINKS)
        .map((element) => {
          const href = String(element.href);
          let resolved: string | null = null;
          let internal = false;
          try {
            const target = new URL(href, url);
            resolved = target.toString();
            internal = target.origin === STORE_ORIGIN;
          } catch {
            resolved = null;
          }
          return { ...element, resolved, internal };
        });
      return { url: url.toString(), count: links.length, links };
    },

    async inspectForms(value) {
      const url = allowedUrl(value);
      const { html } = await fetchHtml(url);
      const elements = extractElements(html);
      const forms = elements.filter((element) => element.tag === "form");
      const controls = elements.filter((element) =>
        ["input", "select", "textarea", "button"].includes(String(element.tag)),
      );
      return {
        url: url.toString(),
        forms,
        controls,
        issues: controls
          .filter(
            (control) =>
              ["input", "select", "textarea"].includes(String(control.tag)) &&
              !control.name &&
              !control.ariaLabel,
          )
          .map((control) => ({ issue: "control_missing_name_or_aria_label", control })),
      };
    },

    async inspectMobileUi(value) {
      const url = allowedUrl(value);
      const { html } = await fetchHtml(url);
      const viewport =
        /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["'][^>]*>/i.exec(html)?.[1] ??
        /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["'][^>]*>/i.exec(html)?.[1] ??
        null;
      return {
        url: url.toString(),
        viewport,
        hasResponsiveViewport: Boolean(viewport?.includes("width=device-width")),
        inspectionMode: "static-mobile-signals",
        note:
          "This V2 tool inspects mobile HTML signals only. Browser-rendered viewport, console, network, and click testing require the Browser/Playwright inspection worker planned next.",
      };
    },

    async inspectSite(value, limit) {
      const start = allowedUrl(value);
      const max = Math.min(Math.max(limit, 1), 25);
      const queue = [start.toString()];
      const seen = new Set<string>();
      const pages: Array<Record<string, unknown>> = [];
      while (queue.length && pages.length < max) {
        const current = queue.shift()!;
        if (seen.has(current)) continue;
        seen.add(current);
        try {
          const url = allowedUrl(current);
          const { html, status } = await fetchHtml(url);
          const signals = pageSignals(html);
          const links = extractElements(html)
            .filter((element) => element.tag === "a" && typeof element.href === "string")
            .map((element) => {
              try {
                return new URL(String(element.href), url);
              } catch {
                return null;
              }
            })
            .filter((target): target is URL => Boolean(target && target.origin === STORE_ORIGIN));
          for (const target of links) {
            target.hash = "";
            if (!seen.has(target.toString()) && queue.length < 100) queue.push(target.toString());
          }
          pages.push({
            url: url.toString(),
            status,
            title: signals.title,
            h1Count: signals.h1.length,
            missingAltImages: signals.missingAltImages,
          });
        } catch (error) {
          pages.push({
            url: current,
            error: error instanceof Error ? error.message : "SITE_INSPECTION_FAILED",
          });
        }
      }
      return { startUrl: start.toString(), scanned: pages.length, limit: max, pages };
    },
  };
}
