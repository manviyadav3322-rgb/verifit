import "server-only";

import { NextResponse } from "next/server";
import { getCurrentUser, type AppUser, type UserRole } from "@/lib/auth/server";
import { getAllowedRequestOrigin } from "@/lib/auth/origin";

export type GuardResult = { user: AppUser; response?: never } | { user?: never; response: NextResponse };

export async function authorizeApi(request: Request, roles?: UserRole[]): Promise<GuardResult> {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
  if (mutating && !getAllowedRequestOrigin(request)) {
    return { response: NextResponse.json({ error: "Invalid or unconfigured request origin." }, { status: 403 }) };
  }

  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (user.accountStatus !== "active") return { response: NextResponse.json({ error: "This account is disabled." }, { status: 403 }) };
  if (roles && !roles.includes(user.role)) return { response: NextResponse.json({ error: "This action is not permitted for your account." }, { status: 403 }) };
  return { user };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
