import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const ACTION = "indexes_whatsapp_order";

type Turnstile = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

function turnstileApi(): Turnstile | undefined {
  return (window as Window & { turnstile?: Turnstile }).turnstile;
}

/**
 * Public site key only, never the Turnstile secret. Rendered exclusively when
 * the non-production preview feature flag is enabled. A new component key
 * resets the one-time token after every failed checkout attempt.
 */
export function ShopifyOrderTurnstile({
  siteKey,
  onTokenChange,
}: {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listener = useRef(onTokenChange);

  useEffect(() => {
    listener.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    listener.current(null);
    if (!siteKey) return;

    let disposed = false;
    let widgetId: string | undefined;

    const renderWidget = () => {
      const api = turnstileApi();
      if (disposed || !api || !containerRef.current || widgetId) return;
      widgetId = api.render(containerRef.current, {
        sitekey: siteKey,
        action: ACTION,
        callback: (token) => listener.current(token),
        "expired-callback": () => listener.current(null),
        "error-callback": () => listener.current(null),
      });
    };

    let script = document.querySelector<HTMLScriptElement>('script[data-indexes-turnstile="true"]');
    if (!script) {
      script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.dataset.indexesTurnstile = "true";
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderWidget);
    if (turnstileApi()) renderWidget();

    return () => {
      disposed = true;
      script?.removeEventListener("load", renderWidget);
      if (widgetId) turnstileApi()?.remove(widgetId);
    };
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p role="alert" className="text-xs text-amber-600">
        معاينة الطلب غير مهيأة: يلزم إعداد مفتاح التحقق العام قبل الاختبار.
      </p>
    );
  }

  return <div ref={containerRef} aria-label="التحقق من الطلب" />;
}
