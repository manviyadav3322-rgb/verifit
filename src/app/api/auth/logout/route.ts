import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { getAllowedRequestOrigin } from "@/lib/auth/origin";

export async function POST(request: Request) {
  const origin = getAllowedRequestOrigin(request);
  if (!origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const secure = new URL(origin).protocol === "https:";
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure, sameSite: secure ? "none" : "lax", path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
