import { NextResponse } from "next/server";
import { createOAuthState, getAllowedRequestOrigin, stateCookieHeader } from "@/lib/auth/origin";

export async function POST(request: Request) {
  const origin = getAllowedRequestOrigin(request);
  if (!origin) return NextResponse.json({ error: "This application origin is not configured for sign-in." }, { status: 403 });
  const portal = process.env.MANUS_OAUTH_PORTAL_URL;
  const appId = process.env.MANUS_PROJECT_ID;
  if (!portal || !appId) return NextResponse.json({ error: "Sign-in is not configured." }, { status: 503 });

  const { state, encoded } = createOAuthState(origin);
  const authorization = new URL("/app-auth", portal);
  authorization.searchParams.set("appId", appId);
  authorization.searchParams.set("redirectUri", state.redirectUri);
  authorization.searchParams.set("state", encoded);
  authorization.searchParams.set("responseType", "code");
  const response = NextResponse.json({ authorizationUrl: authorization.toString() });
  response.headers.append("Set-Cookie", stateCookieHeader(encoded, origin));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
