/**
 * Cookie persistence for the auth token.
 *
 * The cookie is a persistence mechanism only: the token is always sent to the
 * API as an `Authorization: Bearer` header (see jwt.interceptor.ts). The
 * cookie is never sent to the API, so it does not participate in CSRF.
 *
 * Security notes:
 * - `Secure`: only transmitted over HTTPS (required in production, where TLS
 *   is terminated at the reverse proxy).
 * - `SameSite=Lax`: defense in depth; the cookie is not sent on cross-site
 *   requests anyway since it is not used as a credential.
 * - NOT `HttpOnly`: the frontend must read it back to restore the session,
 *   which makes it readable via `document.cookie`. This is an XSS exposure
 *   surface — mitigate with a strict Content-Security-Policy.
 * - Lifetime is bounded by the JWT's `expires_at`, so the cookie never
 *   outlives the token.
 */

const COOKIE_NAME = 'ablapi_token';
const FALLBACK_TTL_MS = 60 * 60 * 1000; // 1 hour if expires_at is missing/invalid

function isBrowser(): boolean {
  return typeof document !== 'undefined';
}

function expiryTimestamp(expiresAt?: string): number {
  if (expiresAt) {
    const ts = new Date(expiresAt).getTime();
    if (!Number.isNaN(ts)) {
      return ts;
    }
  }
  return Date.now() + FALLBACK_TTL_MS;
}

export function setAuthCookie(token: string, expiresAt?: string): void {
  if (!isBrowser()) {
    return;
  }
  const expires = expiryTimestamp(expiresAt);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'Secure',
    'SameSite=Lax',
  ];
  if (expires > Date.now()) {
    parts.push(`Expires=${new Date(expires).toUTCString()}`);
  }
  document.cookie = parts.join('; ');
}

export function getAuthCookie(): string | null {
  if (!isBrowser()) {
    return null;
  }
  const row = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));
  if (!row) {
    return null;
  }
  const value = row.slice(COOKIE_NAME.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function clearAuthCookie(): void {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${COOKIE_NAME}=; Path=/; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
