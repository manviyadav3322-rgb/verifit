import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { db } from "@/db/client";
import { auditLogs, studentProfiles, users } from "@/db/schema";

export const SESSION_COOKIE = "webdev_app_session";
export const OAUTH_STATE_COOKIE = "verifit_oauth_state";
export type UserRole = "student" | "admin";
export type AppUser = {
  id: string;
  openId: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  accountStatus: "active" | "disabled";
};

function signingKey() {
  const secret = process.env.MANUS_JWT_SECRET;
  if (!secret) throw new Error("Application authentication is not configured.");
  return new TextEncoder().encode(secret);
}

function adminEmails() {
  return new Set((process.env.VERIFIT_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export async function upsertOAuthUser(identity: { openId: string; email?: string | null; name?: string | null }) {
  const openId = identity.openId.trim();
  const email = identity.email?.trim().toLowerCase() || null;
  if (!openId) throw new Error("The identity provider returned an invalid user.");
  const displayName = identity.name?.trim().slice(0, 160) || "Student";
  const shouldBeAdmin = Boolean(email && adminEmails().has(email));
  const [existing] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  if (!existing) {
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id,
        openId,
        email,
        displayName,
        role: shouldBeAdmin ? "admin" : "student",
        accountStatus: "active",
        lastLoginAt: new Date(),
      });
      await tx.insert(studentProfiles).values({ userId: id });
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        actorUserId: id,
        action: "auth.login",
        entityType: "user",
        entityId: id,
      });
    });
  } else {
    await db.update(users).set({
      email,
      displayName,
      lastLoginAt: new Date(),
    }).where(eq(users.id, existing.id));
  }

  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (!user || user.accountStatus !== "active") throw new Error("This VeriFit account is disabled.");
  return user as AppUser;
}

export async function signSession(user: AppUser) {
  const appId = process.env.MANUS_PROJECT_ID;
  if (!appId) throw new Error("Application authentication is not configured.");
  return new SignJWT({ appId, openId: user.openId, email: user.email, name: user.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(signingKey());
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const projectId = process.env.MANUS_PROJECT_ID;
  if (!token || !projectId) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] }));
  } catch {
    return null;
  }
  if (payload.appId !== projectId || typeof payload.openId !== "string" || !payload.openId) return null;

  const [user] = await db.select().from(users).where(eq(users.openId, payload.openId)).limit(1);
  if (user) return user.accountStatus === "active" ? user as AppUser : null;

  const email = typeof payload.email === "string" ? payload.email : null;
  return upsertOAuthUser({ openId: payload.openId, email, name: typeof payload.name === "string" ? payload.name : "Student" });
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user as AppUser | undefined;
}
