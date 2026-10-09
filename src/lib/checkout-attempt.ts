/** Persist only an opaque digest and UUID, never customer input, across retry/reload. */
export async function checkoutAttemptKey(signature: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const storageKey = `indexes-checkout-attempt:${hash}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  } catch {
    /* In-memory retry still works when storage is blocked. */
  }
  const key = crypto.randomUUID();
  try {
    sessionStorage.setItem(storageKey, key);
  } catch {
    /* Optional persistence. */
  }
  return key;
}

export function completeCheckoutAttempt(key: string) {
  try {
    for (const storageKey of Object.keys(sessionStorage)) {
      if (
        storageKey.startsWith("indexes-checkout-attempt:") &&
        sessionStorage.getItem(storageKey) === key
      )
        sessionStorage.removeItem(storageKey);
    }
  } catch {
    /* Storage may be blocked. */
  }
}
