import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getProfile } from "@/lib/data/profile";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const profile = await getProfile(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, profile }, { headers: { "Cache-Control": "no-store" } });
}
