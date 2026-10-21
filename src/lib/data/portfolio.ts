import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull, like, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { evidenceMatches, evidenceProjectSources, evidenceResumeSources, evidenceSkillSources, evidenceSources, jobRequirements, jobs, projects, resumes, studentSkills } from "@/db/schema";

export async function listSkills(userId: string, query = "", sort = "name") {
  const filters: SQL[] = [eq(studentSkills.userId, userId), isNull(studentSkills.archivedAt)];
  if (query.trim()) filters.push(like(studentSkills.name, `%${query.trim().slice(0, 100)}%`));
  return db.select().from(studentSkills).where(and(...filters)).orderBy(sort === "created" ? desc(studentSkills.createdAt) : asc(studentSkills.name)).limit(200);
}

export async function createSkill(userId: string, input: { name: string; proficiency: "beginner" | "intermediate" | "advanced" }) {
  const id = randomUUID();
  await db.insert(studentSkills).values({ id, userId, name: input.name, proficiency: input.proficiency });
  const [created] = await db.select().from(studentSkills).where(eq(studentSkills.id, id)).limit(1);
  return created;
}

export async function updateSkill(userId: string, id: string, input: { name?: string; proficiency?: "beginner" | "intermediate" | "advanced" }) {
  await db.update(studentSkills).set(input).where(and(eq(studentSkills.id, id), eq(studentSkills.userId, userId), isNull(studentSkills.archivedAt)));
  const [row] = await db.select().from(studentSkills).where(and(eq(studentSkills.id, id), eq(studentSkills.userId, userId), isNull(studentSkills.archivedAt))).limit(1);
  return row ?? null;
}

export async function archiveSkill(userId: string, id: string) {
  await db.update(studentSkills).set({ archivedAt: new Date() }).where(and(eq(studentSkills.id, id), eq(studentSkills.userId, userId), isNull(studentSkills.archivedAt)));
  return true;
}

export async function listProjects(userId: string, query = "", sort = "updated") {
  const filters: SQL[] = [eq(projects.userId, userId), isNull(projects.archivedAt)];
  if (query.trim()) filters.push(or(like(projects.title, `%${query.trim().slice(0, 100)}%`), like(projects.description, `%${query.trim().slice(0, 100)}%`))!);
  return db.select().from(projects).where(and(...filters)).orderBy(sort === "title" ? asc(projects.title) : desc(projects.updatedAt)).limit(200);
}

export async function createProject(userId: string, input: { title: string; description: string; repositoryUrl?: string; liveUrl?: string }) {
  const id = randomUUID();
  await db.insert(projects).values({ id, userId, title: input.title, description: input.description, repositoryUrl: input.repositoryUrl || null, liveUrl: input.liveUrl || null });
  const [created] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return created;
}

export async function updateProject(userId: string, id: string, input: { title?: string; description?: string; repositoryUrl?: string | null; liveUrl?: string | null }) {
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.repositoryUrl !== undefined ? { repositoryUrl: input.repositoryUrl || null } : {}),
    ...(input.liveUrl !== undefined ? { liveUrl: input.liveUrl || null } : {}),
  };
  if (Object.keys(values).length) await db.update(projects).set(values).where(and(eq(projects.id, id), eq(projects.userId, userId), isNull(projects.archivedAt)));
  const [row] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId), isNull(projects.archivedAt))).limit(1);
  return row ?? null;
}

export async function archiveProject(userId: string, id: string) {
  await db.update(projects).set({ archivedAt: new Date() }).where(and(eq(projects.id, id), eq(projects.userId, userId), isNull(projects.archivedAt)));
  return true;
}

export async function listEvidence(userId: string, query = "", sort = "newest") {
  const filters: SQL[] = [eq(evidenceSources.userId, userId), eq(evidenceSources.sourceStatus, "active")];
  if (query.trim()) filters.push(or(like(evidenceSources.title, `%${query.trim().slice(0, 100)}%`), like(evidenceSources.excerpt, `%${query.trim().slice(0, 100)}%`))!);
  const rows = await db.select({
    id: evidenceSources.id,
    sourceType: evidenceSources.sourceType,
    title: evidenceSources.title,
    excerpt: evidenceSources.excerpt,
    sourceUrl: evidenceSources.sourceUrl,
    createdAt: evidenceSources.createdAt,
    matchId: evidenceMatches.id,
    requirementId: evidenceMatches.requirementId,
    requirementName: jobRequirements.name,
    reviewStatus: evidenceMatches.reviewStatus,
    reviewNote: evidenceMatches.reviewNote,
  }).from(evidenceSources)
    .leftJoin(evidenceMatches, eq(evidenceMatches.evidenceId, evidenceSources.id))
    .leftJoin(jobRequirements, eq(jobRequirements.id, evidenceMatches.requirementId))
    .where(and(...filters))
    .orderBy(sort === "title" ? asc(evidenceSources.title) : desc(evidenceSources.createdAt))
    .limit(400);
  const grouped = new Map<string, { id: string; sourceType: string; title: string; excerpt: string; sourceUrl: string | null; createdAt: Date; matches: Array<{ id: string; requirementId: string; requirementName: string; reviewStatus: string; reviewNote: string | null }> }>();
  for (const row of rows) {
    const item = grouped.get(row.id) ?? { id: row.id, sourceType: row.sourceType, title: row.title, excerpt: row.excerpt, sourceUrl: row.sourceUrl, createdAt: row.createdAt, matches: [] };
    if (row.matchId && row.requirementId && row.requirementName && row.reviewStatus) item.matches.push({ id: row.matchId, requirementId: row.requirementId, requirementName: row.requirementName, reviewStatus: row.reviewStatus, reviewNote: row.reviewNote });
    grouped.set(row.id, item);
  }
  return [...grouped.values()];
}

export async function createEvidence(userId: string, input: { sourceType: "resume" | "project" | "skill" | "external"; title: string; excerpt: string; sourceUrl?: string; sourceRefId?: string; requirementId?: string }) {
  const id = randomUUID();
  if (input.sourceType === "resume") {
    if (!input.sourceRefId) return null;
    const [source] = await db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, input.sourceRefId), eq(resumes.userId, userId), eq(resumes.fileStatus, "active"))).limit(1);
    if (!source) return null;
  }
  if (input.sourceType === "project") {
    if (!input.sourceRefId) return null;
    const [source] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.id, input.sourceRefId), eq(projects.userId, userId), isNull(projects.archivedAt))).limit(1);
    if (!source) return null;
  }
  if (input.sourceType === "skill") {
    if (!input.sourceRefId) return null;
    const [source] = await db.select({ id: studentSkills.id }).from(studentSkills).where(and(eq(studentSkills.id, input.sourceRefId), eq(studentSkills.userId, userId), isNull(studentSkills.archivedAt))).limit(1);
    if (!source) return null;
  }
  if (input.requirementId) {
    const [requirement] = await db.select({ id: jobRequirements.id }).from(jobRequirements).innerJoin(jobs, eq(jobs.id, jobRequirements.jobId)).where(and(eq(jobRequirements.id, input.requirementId), eq(jobs.jobStatus, "open"))).limit(1);
    if (!requirement) return null;
  }
  await db.transaction(async (tx) => {
    await tx.insert(evidenceSources).values({ id, userId, sourceType: input.sourceType, title: input.title, excerpt: input.excerpt, sourceUrl: input.sourceUrl || null });
    if (input.sourceType === "resume" && input.sourceRefId) await tx.insert(evidenceResumeSources).values({ evidenceId: id, resumeId: input.sourceRefId });
    if (input.sourceType === "project" && input.sourceRefId) await tx.insert(evidenceProjectSources).values({ evidenceId: id, projectId: input.sourceRefId });
    if (input.sourceType === "skill" && input.sourceRefId) await tx.insert(evidenceSkillSources).values({ evidenceId: id, skillId: input.sourceRefId });
    if (input.requirementId) await tx.insert(evidenceMatches).values({ id: randomUUID(), evidenceId: id, requirementId: input.requirementId, createdBy: userId, reviewStatus: "pending" });
  });
  return (await listEvidence(userId)).find((item) => item.id === id) ?? null;
}

export async function updateEvidence(userId: string, id: string, input: { title?: string; excerpt?: string; sourceUrl?: string | null }) {
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
    ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl || null } : {}),
  };
  if (Object.keys(values).length) await db.update(evidenceSources).set(values).where(and(eq(evidenceSources.id, id), eq(evidenceSources.userId, userId), eq(evidenceSources.sourceStatus, "active")));
  return (await listEvidence(userId)).find((item) => item.id === id) ?? null;
}

export async function deleteEvidence(userId: string, id: string) {
  await db.update(evidenceSources).set({ sourceStatus: "deleted" }).where(and(eq(evidenceSources.id, id), eq(evidenceSources.userId, userId), eq(evidenceSources.sourceStatus, "active")));
  return true;
}

export async function linkEvidenceToRequirement(userId: string, evidenceId: string, requirementId: string) {
  const [source] = await db.select({ id: evidenceSources.id }).from(evidenceSources).where(and(eq(evidenceSources.id, evidenceId), eq(evidenceSources.userId, userId), eq(evidenceSources.sourceStatus, "active"))).limit(1);
  const [requirement] = await db.select({ id: jobRequirements.id }).from(jobRequirements).innerJoin(jobs, eq(jobs.id, jobRequirements.jobId)).where(and(eq(jobRequirements.id, requirementId), eq(jobs.jobStatus, "open"))).limit(1);
  if (!source || !requirement) return null;
  const [existing] = await db.select({ id: evidenceMatches.id }).from(evidenceMatches).where(and(eq(evidenceMatches.evidenceId, evidenceId), eq(evidenceMatches.requirementId, requirementId))).limit(1);
  if (existing) return null;
  const id = randomUUID();
  await db.insert(evidenceMatches).values({ id, evidenceId, requirementId, createdBy: userId, reviewStatus: "pending" });
  return id;
}
