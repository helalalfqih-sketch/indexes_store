/**
 * A browser Origin header is not authorization. Require a one-time server-
 * verified bot challenge before enabling public guest Shopify order writes.
 * The secret must remain server-side, never in the Shopify theme.
 */
export class CheckoutChallengeError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
  }
}

function trustedHostname(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.startsWith("https://") ? value : `https://${value}`);
    return url.protocol === "https:" ? url.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function verifyShopifyOrderChallenge(
  rawToken: unknown,
  request: Request,
): Promise<void> {
  const secret = process.env.SHOPIFY_ORDER_TURNSTILE_SECRET?.trim();
  if (!secret) {
    throw new CheckoutChallengeError(503, "CHECKOUT_CHALLENGE_NOT_CONFIGURED");
  }
  if (
    typeof rawToken !== "string" ||
    rawToken.length < 20 ||
    rawToken.length > 2048
  ) {
    throw new CheckoutChallengeError(403, "CHECKOUT_CHALLENGE_REQUIRED");
  }
  const hostname = trustedHostname(request.headers.get("origin") ?? undefined);
  const trusted = [
    trustedHostname(process.env.SHOPIFY_STORE_DOMAIN),
    trustedHostname(process.env.SHOPIFY_STOREFRONT_ORIGIN),
    trustedHostname(new URL(request.url).origin),
  ].filter((candidate): candidate is string => Boolean(candidate));
  if (!hostname || !trusted.includes(hostname)) {
    throw new CheckoutChallengeError(403, "CHECKOUT_CHALLENGE_INVALID");
  }

  let verified: {
    success?: boolean;
    hostname?: string;
    action?: string;
  };
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: rawToken }).toString(),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new CheckoutChallengeError(503, "CHECKOUT_CHALLENGE_UNAVAILABLE");
    }
    verified = (await response.json()) as typeof verified;
  } catch {
    throw new CheckoutChallengeError(503, "CHECKOUT_CHALLENGE_UNAVAILABLE");
  }
  if (
    verified.success !== true ||
    verified.hostname?.toLowerCase() !== hostname ||
    verified.action !== "indexes_whatsapp_order"
  ) {
    throw new CheckoutChallengeError(403, "CHECKOUT_CHALLENGE_INVALID");
  }
}
