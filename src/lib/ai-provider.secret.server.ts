const ENV_SECRET_PREFIX = "ENV:";
const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]{2,127}$/;

export type AIProviderSecretReference = `${typeof ENV_SECRET_PREFIX}${string}`;

export function isMaskedSecret(value?: string | null): boolean {
  return Boolean(value?.startsWith("••••"));
}

export function isEnvironmentSecretReference(value?: string | null): value is AIProviderSecretReference {
  if (!value?.startsWith(ENV_SECRET_PREFIX)) return false;
  return ENV_NAME_PATTERN.test(value.slice(ENV_SECRET_PREFIX.length));
}

export function normalizeEnvironmentSecretReference(value?: string | null): AIProviderSecretReference | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (isMaskedSecret(trimmed)) {
    throw new Error("Masked secret values cannot be stored as new credentials");
  }
  if (!isEnvironmentSecretReference(trimmed)) {
    throw new Error(
      "AI provider credentials must be stored as an environment reference such as ENV:OPENAI_API_KEY",
    );
  }
  return trimmed;
}

export function resolveEnvironmentSecret(reference?: string | null): string | null {
  if (!reference) return null;
  if (reference.startsWith("ENC:") || !isEnvironmentSecretReference(reference)) {
    throw new Error(
      "Legacy or plaintext AI provider credentials are disabled. Replace the stored value with an ENV:VARIABLE_NAME reference.",
    );
  }

  const variableName = reference.slice(ENV_SECRET_PREFIX.length);
  const value = process.env[variableName];
  if (!value) {
    throw new Error(`Required server secret ${variableName} is not configured`);
  }
  return value;
}

export function maskSecretReference(reference?: string | null): string {
  if (!reference) return "";
  if (!isEnvironmentSecretReference(reference)) return "••••••••••••";
  const variableName = reference.slice(ENV_SECRET_PREFIX.length);
  return `ENV:${variableName}`;
}
