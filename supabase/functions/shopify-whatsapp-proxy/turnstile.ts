/**
 * Server-only Cloudflare Turnstile verification for Shopify guest checkout.
 * Never expose the Turnstile secret in a Shopify Liquid theme or client JS.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
export const INDEXES_ORDER_ACTION = "indexes_whatsapp_order";

export class TurnstileValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
    this.name = "TurnstileValidationError";
  }
}

type TurnstileResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export async function verifyOneUseCheckoutChallenge(
  token: unknown,
  secret: string | undefined,
  expectedHostname: string,
  transport: typeof fetch = fetch,
): Promise<void> {
  if (!secret || secret.length < 12 || !/^[a-z0-9.-]+$/.test(expectedHostname)) {
    throw new TurnstileValidationError("TURNSTILE_NOT_CONFIGURED", 503);
  }
  if (typeof token !== "string" || token.length < 20 || token.length > 2048) {
    throw new TurnstileValidationError("TURNSTILE_TOKEN_REQUIRED", 403);
  }

  let response: Response;
  let payload: unknown;
  try {
    response = await transport(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      throw new Error("Turnstile verification provider unavailable");
    }
    payload = await response.json();
  } catch {
    throw new TurnstileValidationError("TURNSTILE_VERIFICATION_UNAVAILABLE", 503);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TurnstileValidationError("TURNSTILE_VERIFICATION_UNAVAILABLE", 503);
  }
  const result = payload as TurnstileResult;
  if (
    result.success !== true ||
    result.hostname?.toLowerCase() !== expectedHostname ||
    result.action !== INDEXES_ORDER_ACTION
  ) {
    throw new TurnstileValidationError("TURNSTILE_VERIFICATION_FAILED", 403);
  }
}
