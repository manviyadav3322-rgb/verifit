import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceMatches, evidenceSources, jobRequirements, jobs, resources, users } from "@/db/schema";
import { recordAudit } from "@/lib/data/audit";

export async function listUsers() {
  return db.select({ id: users.id, email: users.email, displayName: users.displayName, role: users.role, accountStatus: users.accountStatus, createdAt: users.createdAt })
    .from(users).orderBy(asc(users.displayName)).limit(500);
}

export async function updateUserAccess(actorId: string, userId: string, input: { role?: "student" | "admin"; accountStatus?: "active" | "disabled" }) {
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return null;
  const demoting = target.role === "admin" && input.role === "student";
  const disabling = target.role === "admin" && target.accountStatus === "active" && input.accountStatus === "disabled";
  if (demoting || disabling) {
    const [count] = await db.select({ total: sql<number>`count(*)` }).from(users).where(and(eq(users.role, "admin"), eq(users.accountStatus, "active"), ne(users.id, userId)));
    if (Number(count?.total ?? 0) === 0) throw new Error("At least one active administrator must remain.");
  }
  const values = { ...(input.role !== undefined ? { role: input.role } : {}), ...(input.accountStatus !== undefined ? { accountStatus: input.accountStatus } : {}) };
  if (Object.keys(values).length) await db.update(users).set(values).where(eq(users.id, userId));
  await recordAudit(actorId, "admin.user_access_updated", "user", userId, values);
  const [updated] = await db.select({ id: users.id, email: users.email, displayName: users.displayName, role: users.role, accountStatus: users.accountStatus, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
  return updated ?? null;
}

export async function listEvidenceForReview() {
  return db.select({ matchId: evidenceMatches.id, evidenceId: evidenceSources.id, ownerId: evidenceSources.userId, title: evidenceSources.title, excerpt: evidenceSources.excerpt, sourceType: evidenceSources.sourceType, sourceUrl: evidenceSources.sourceUrl, reviewStatus: evidenceMatches.reviewStatus, reviewNote: evidenceMatches.reviewNote, createdAt: evidenceMatches.createdAt, requirementId: jobRequirements.id, requirement: jobRequirements.name, jobId: jobs.id, jobTitle: jobs.title })
    .from(evidenceMatches).innerJoin(evidenceSources, eq(evidenceSources.id, evidenceMatches.evidenceId)).innerJoin(jobRequirements, eq(jobRequirements.id, evidenceMatches.requirementId)).innerJoin(jobs, eq(jobs.id, jobRequirements.jobId))
    .where(and(ne(evidenceMatches.reviewStatus, "rejected"), eq(evidenceSources.sourceStatus, "active"))).orderBy(asc(evidenceMatches.reviewStatus), asc(evidenceMatches.createdAt)).limit(500);
}

export async function reviewEvidenceMatch(adminId: string, matchId: string, input: { reviewStatus: "accepted" | "partial" | "rejected"; reviewNote?: string }) {
  const [match] = await db.select({ id: evidenceMatches.id }).from(evidenceMatches).where(eq(evidenceMatches.id, matchId)).limit(1);
  if (!match) return null;
  await db.update(evidenceMatches).set({ reviewStatus: input.reviewStatus, reviewNote: input.reviewNote || null, reviewedBy: adminId, reviewedAt: new Date() }).where(eq(evidenceMatches.id, matchId));
  await recordAudit(adminId, "evidence.reviewed", "evidence_match", matchId, { status: input.reviewStatus });
  return { id: matchId, reviewStatus: input.reviewStatus };
}

export async function listResources(includeDrafts = false) {
  return db.select().from(resources).where(includeDrafts ? undefined : eq(resources.visibility, "published")).orderBy(asc(resources.category), asc(resources.title)).limit(300);
}

export async function createResource(adminId: string, input: { title: string; category: string; description: string; resourceUrl: string; visibility: "draft" | "published" | "archived" }) {
  const id = randomUUID();
  await db.insert(resources).values({ id, ...input, createdBy: adminId });
  await recordAudit(adminId, "resource.created", "resource", id);
  const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return row;
}

export async function updateResource(adminId: string, id: string, input: Partial<{ title: string; category: string; description: string; resourceUrl: string; visibility: "draft" | "published" | "archived" }>) {
  if (Object.keys(input).length) await db.update(resources).set(input).where(eq(resources.id, id));
  const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (row) await recordAudit(adminId, "resource.updated", "resource", id, input);
  return row ?? null;
}

export async function archiveResource(adminId: string, id: string) {
  await db.update(resources).set({ visibility: "archived" }).where(eq(resources.id, id));
  await recordAudit(adminId, "resource.archived", "resource", id);
  return true;
}
