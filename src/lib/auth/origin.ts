import { randomBytes, timingSafeEqual } from "node:crypto";
import { OAUTH_STATE_COOKIE } from "@/lib/auth/server";

export type OAuthState = { redirectUri: string; nonce: string };

export function allowedOrigins() {
  return new Set((process.env.VERIFIT_ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean).map((value) => {
    try {
      const parsed = new URL(value);
      if ((parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) || parsed.pathname !== "/" || parsed.search || parsed.hash) return "";
      return parsed.origin;
    } catch { return ""; }
  }).filter(Boolean));
}

function canonicalOrigin(value: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.origin !== value || parsed.pathname !== "/" || parsed.search || parsed.hash || parsed.username || parsed.password) return null;
    return parsed.origin;
  } catch { return null; }
}

function forwardedPublicOrigin(request: Request) {
  const host = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto")?.toLowerCase();
  if (!host || host.includes(",") || !protocol || protocol.includes(",") || (protocol !== "https" && protocol !== "http")) return null;
  return canonicalOrigin(`${protocol}://${host}`);
}

export function getAllowedRequestOrigin(request: Request) {
  const allowlist = allowedOrigins();
  const headerOrigin = request.headers.get("origin");
  const suppliedOrigin = request.headers.get("x-verifit-origin");
  const header = headerOrigin ? canonicalOrigin(headerOrigin) : null;
  const supplied = suppliedOrigin ? canonicalOrigin(suppliedOrigin) : null;
  const forwarded = forwardedPublicOrigin(request);

  if (headerOrigin && !header) return null;

  // If Preview rebases Origin to the internal listener, accept only when the browser-supplied
  // origin and ingress-forwarded public origin agree exactly and that origin is allowlisted.
  if (header && !allowlist.has(header)) {
    return supplied && allowlist.has(supplied) && forwarded === supplied ? supplied : null;
  }

  const candidate = header ?? supplied;
  if (!candidate || !allowlist.has(candidate)) return null;
  if (header && supplied && header !== supplied) return null;
  if (forwarded && forwarded !== candidate) return null;
  return candidate;
}

export function createOAuthState(origin: string) {
  const state: OAuthState = { redirectUri: `${origin}/api/auth/callback`, nonce: randomBytes(24).toString("base64url") };
  const encoded = Buffer.from(JSON.stringify(state)).toString("base64");
  return { state, encoded };
}

export function serializeOAuthStateCookie(encoded: string, origin: string) {
  const secure = new URL(origin).protocol === "https:";
  return `${OAUTH_STATE_COOKIE}=${encodeURIComponent(encoded)}; Path=/; HttpOnly; Max-Age=600; SameSite=${secure ? "None; Secure" : "Lax"}`;
}

export function decodeOAuthState(encoded: string | null): OAuthState | null {
  if (!encoded || encoded.length > 4096) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as Partial<OAuthState>;
    if (typeof value.redirectUri !== "string" || typeof value.nonce !== "string") return null;
    const callback = new URL(value.redirectUri);
    const permitted = allowedOrigins();
    if (callback.pathname !== "/api/auth/callback" || callback.search || callback.hash || !permitted.has(callback.origin)) return null;
    if (!/^[A-Za-z0-9_-]{32,80}$/.test(value.nonce)) return null;
    return { redirectUri: callback.toString(), nonce: value.nonce };
  } catch { return null; }
}

export function equalState(a: string | undefined, b: string | null) {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function stateCookieHeader(encoded: string, origin: string) {
  return serializeOAuthStateCookie(encoded, origin);
}
