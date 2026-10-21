import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decodeOAuthState, equalState } from "@/lib/auth/origin";
import { OAUTH_STATE_COOKIE, SESSION_COOKIE, signSession, upsertOAuthUser } from "@/lib/auth/server";

function fail(origin: string | null, code = "auth_failed") {
  if (!origin) return NextResponse.json({ error: "OAuth state validation failed." }, { status: 400 });
  const url = new URL("/login", origin);
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url);
  const secure = new URL(origin).protocol === "https:";
  response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, secure, sameSite: secure ? "none" : "lax", path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const stateValue = request.nextUrl.searchParams.get("state");
  const state = decodeOAuthState(stateValue);
  const origin = state ? new URL(state.redirectUri).origin : null;
  const jar = await cookies();
  const cookieState = jar.get(OAUTH_STATE_COOKIE)?.value;
  if (!state) {
    console.error("VeriFit OAuth rejected an invalid state payload.");
    return fail(origin, "oauth_state_invalid");
  }
  if (!equalState(cookieState, stateValue)) {
    const errorCode = cookieState ? "oauth_state_mismatch" : "oauth_state_cookie_missing";
    console.error("VeriFit OAuth state binding failed:", cookieState ? "cookie mismatch" : "cookie missing");
    return fail(origin, errorCode);
  }

  const callbackOrigin = new URL(state.redirectUri).origin;
  const code = request.nextUrl.searchParams.get("code");
  if (!code || code.length > 4096) return fail(callbackOrigin, "oauth_code_missing");
  const apiBase = process.env.MANUS_OAUTH_API_URL;
  const projectId = process.env.MANUS_PROJECT_ID;
  if (!apiBase || !projectId) return fail(callbackOrigin, "auth_unavailable");

  let failureStage = "token_exchange";
  try {
    const tokenResponse = await fetch(new URL("/webdev.v1.WebDevAuthPublicService/ExchangeToken", apiBase), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ clientId: projectId, grantType: "authorization_code", code, redirectUri: state.redirectUri }),
    });
    if (!tokenResponse.ok) {
      console.error("VeriFit OAuth token exchange rejected with HTTP", tokenResponse.status);
      return fail(callbackOrigin, "token_exchange_failed");
    }
    const tokenBody = await tokenResponse.json() as { accessToken?: unknown };
    if (typeof tokenBody.accessToken !== "string" || tokenBody.accessToken.length < 10) return fail(callbackOrigin, "token_exchange_failed");

    failureStage = "identity_lookup";
    const identityResponse = await fetch(new URL("/webdev.v1.WebDevAuthPublicService/GetUserInfo", apiBase), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ accessToken: tokenBody.accessToken }),
    });
    if (!identityResponse.ok) {
      console.error("VeriFit OAuth identity lookup rejected with HTTP", identityResponse.status);
      return fail(callbackOrigin, "identity_lookup_failed");
    }
    const identity = await identityResponse.json() as { openId?: unknown; email?: unknown; name?: unknown };
    if (typeof identity.openId !== "string" || !identity.openId) return fail(callbackOrigin, "identity_lookup_failed");

    failureStage = "account_setup";
    const user = await upsertOAuthUser({
      openId: identity.openId,
      email: typeof identity.email === "string" ? identity.email : null,
      name: typeof identity.name === "string" ? identity.name : "Student",
    });
    failureStage = "session_setup";
    const token = await signSession(user);
    const response = NextResponse.redirect(new URL("/dashboard", callbackOrigin));
    const secure = new URL(callbackOrigin).protocol === "https:";
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: secure ? "none" : "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });
    response.cookies.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, secure, sameSite: secure ? "none" : "lax", path: "/", maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "This VeriFit account is disabled.") {
      console.error("VeriFit OAuth account is disabled.");
      return fail(callbackOrigin, "account_disabled");
    }
    console.error("VeriFit OAuth callback failed at stage:", failureStage);
    return fail(callbackOrigin, `${failureStage}_failed`);
  }
}
