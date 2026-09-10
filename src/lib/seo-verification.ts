/**
 * Normalize a Google Search Console meta verification value.
 *
 * The CMS historically accepted full meta tags and verification HTML filenames.
 * Only the token from the meta tag's content attribute is valid in
 * <meta name="google-site-verification" content="...">.
 */
export function normalizeGoogleVerificationCode(value?: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const contentMatch = trimmed.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
  if (contentMatch?.[1]) return contentMatch[1].trim();

  if (/^google[a-z0-9_-]+\.html$/i.test(trimmed)) return "";

  return trimmed;
}
