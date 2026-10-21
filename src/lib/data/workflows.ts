import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, assessments, jobs, jobRequirements, roadmapActions } from "@/db/schema";
import { recordAudit } from "@/lib/data/audit";

export async function listRoadmapActions(userId: string) {
  return db.select({ id: roadmapActions.id, title: roadmapActions.title, effort: roadmapActions.effort, requiredEvidence: roadmapActions.requiredEvidence, actionStatus: roadmapActions.actionStatus, requirementId: roadmapActions.requirementId, sourceAssessmentId: roadmapActions.sourceAssessmentId, requirementName: jobRequirements.name, createdAt: roadmapActions.createdAt, updatedAt: roadmapActions.updatedAt })
    .from(roadmapActions).leftJoin(jobRequirements, eq(jobRequirements.id, roadmapActions.requirementId)).where(eq(roadmapActions.userId, userId)).orderBy(desc(roadmapActions.createdAt)).limit(200);
}

export async function createRoadmapAction(userId: string, input: { title: string; effort: "small" | "medium" | "large"; requiredEvidence?: string; requirementId?: string; sourceAssessmentId?: string }) {
  if (input.requirementId) {
    const [requirement] = await db.select({ id: jobRequirements.id }).from(jobRequirements).where(eq(jobRequirements.id, input.requirementId)).limit(1);
    if (!requirement) return null;
  }
  if (input.sourceAssessmentId) {
    const [assessment] = await db.select({ id: assessments.id }).from(assessments).where(and(eq(assessments.id, input.sourceAssessmentId), eq(assessments.userId, userId))).limit(1);
    if (!assessment) return null;
  }
  const id = randomUUID();
  await db.insert(roadmapActions).values({ id, userId, title: input.title, effort: input.effort, requiredEvidence: input.requiredEvidence || null, requirementId: input.requirementId || null, sourceAssessmentId: input.sourceAssessmentId || null });
  await recordAudit(userId, "roadmap.created", "roadmap_action", id);
  const [row] = await db.select().from(roadmapActions).where(eq(roadmapActions.id, id)).limit(1);
  return row;
}

export async function updateRoadmapAction(userId: string, id: string, input: { title?: string; effort?: "small" | "medium" | "large"; requiredEvidence?: string; actionStatus?: "not_started" | "in_progress" | "completed" }) {
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.effort !== undefined ? { effort: input.effort } : {}),
    ...(input.requiredEvidence !== undefined ? { requiredEvidence: input.requiredEvidence || null } : {}),
    ...(input.actionStatus !== undefined ? { actionStatus: input.actionStatus } : {}),
  };
  if (Object.keys(values).length) await db.update(roadmapActions).set(values).where(and(eq(roadmapActions.id, id), eq(roadmapActions.userId, userId)));
  const [row] = await db.select().from(roadmapActions).where(and(eq(roadmapActions.id, id), eq(roadmapActions.userId, userId))).limit(1);
  if (row) await recordAudit(userId, "roadmap.updated", "roadmap_action", id, { status: row.actionStatus });
  return row ?? null;
}

export async function deleteRoadmapAction(userId: string, id: string) {
  await db.delete(roadmapActions).where(and(eq(roadmapActions.id, id), eq(roadmapActions.userId, userId)));
  await recordAudit(userId, "roadmap.deleted", "roadmap_action", id);
  return true;
}

export async function listApplications(userId: string) {
  return db.select({ id: applications.id, jobId: applications.jobId, title: jobs.title, company: jobs.company, location: jobs.location, stage: applications.applicationStage, appliedOn: applications.appliedOn, notes: applications.notes, createdAt: applications.createdAt, updatedAt: applications.updatedAt })
    .from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId)).where(eq(applications.userId, userId)).orderBy(desc(applications.updatedAt)).limit(200);
}

export async function createApplication(userId: string, jobId: string) {
  const [job] = await db.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.id, jobId), eq(jobs.jobStatus, "open"))).limit(1);
  if (!job) return null;
  const [existing] = await db.select({ id: applications.id }).from(applications).where(and(eq(applications.userId, userId), eq(applications.jobId, jobId))).limit(1);
  if (existing) return existing;
  const id = randomUUID();
  await db.insert(applications).values({ id, userId, jobId, applicationStage: "saved" });
  await recordAudit(userId, "application.saved", "application", id, { jobId });
  return { id, jobId, stage: "saved" as const };
}

export async function updateApplication(userId: string, id: string, input: { applicationStage?: "saved" | "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn"; appliedOn?: string | null; notes?: string | null }) {
  const values = {
    ...(input.applicationStage !== undefined ? { applicationStage: input.applicationStage } : {}),
    ...(input.appliedOn !== undefined ? { appliedOn: input.appliedOn || null } : {}),
    ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
  };
  if (Object.keys(values).length) await db.update(applications).set(values).where(and(eq(applications.id, id), eq(applications.userId, userId)));
  const [row] = await db.select().from(applications).where(and(eq(applications.id, id), eq(applications.userId, userId))).limit(1);
  if (row) await recordAudit(userId, "application.updated", "application", id, { stage: row.applicationStage });
  return row ?? null;
}

export async function deleteApplication(userId: string, id: string) {
  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));
  await recordAudit(userId, "application.deleted", "application", id);
  return true;
}
