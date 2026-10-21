import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, assessmentResults, assessments, auditLogs, jobs } from "@/db/schema";
import { getAssessmentResult } from "@/lib/data/assessments";

export async function getUserHistory(userId: string) {
  const [assessmentRows, eventRows] = await Promise.all([
    db.select({ id: assessments.id, jobId: assessments.jobId, startedAt: assessments.startedAt, jobTitle: jobs.title, company: jobs.company })
      .from(assessments).innerJoin(jobs, eq(jobs.id, assessments.jobId)).where(eq(assessments.userId, userId)).orderBy(desc(assessments.startedAt)).limit(100),
    db.select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt })
      .from(auditLogs).where(eq(auditLogs.actorUserId, userId)).orderBy(desc(auditLogs.createdAt)).limit(200),
  ]);
  return { assessments: assessmentRows, events: eventRows };
}

export async function getUserReport(userId: string) {
  const [assessmentRows, stageRows, resultCountRows, applicationCountRows, assessmentCountRows] = await Promise.all([
    db.select({ id: assessments.id, jobId: assessments.jobId, startedAt: assessments.startedAt, jobTitle: jobs.title, company: jobs.company })
      .from(assessments).innerJoin(jobs, eq(jobs.id, assessments.jobId)).where(eq(assessments.userId, userId)).orderBy(desc(assessments.startedAt)).limit(100),
    db.select({ stage: applications.applicationStage, count: sql<number>`count(*)` }).from(applications).where(eq(applications.userId, userId)).groupBy(applications.applicationStage),
    db.select({ count: sql<number>`count(*)` }).from(assessmentResults).innerJoin(assessments, eq(assessments.id, assessmentResults.assessmentId)).where(eq(assessments.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(applications).where(eq(applications.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(assessments).where(eq(assessments.userId, userId)),
  ]);
  const assessmentsWithResults = await Promise.all(assessmentRows.map(async (assessment) => {
    const result = await getAssessmentResult(userId, assessment.id);
    return { ...assessment, met: result?.summary.met ?? 0, partial: result?.summary.partial ?? 0, notEvidenced: result?.summary.notEvidenced ?? 0, requirementCount: result?.summary.total ?? 0 };
  }));
  return {
    assessments: assessmentsWithResults,
    applicationStages: stageRows,
    totalAssessments: Number(assessmentCountRows[0]?.count ?? 0),
    totalResults: Number(resultCountRows[0]?.count ?? 0),
    totalApplications: Number(applicationCountRows[0]?.count ?? 0),
  };
}

export function reportToCsv(report: Awaited<ReturnType<typeof getUserReport>>) {
  const quote = (value: unknown) => {
    const raw = String(value ?? "");
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const rows = [
    ["record_type", "job", "company", "date", "stage", "met", "partial", "not_evidenced", "requirements"],
    ...report.assessments.map((row) => ["assessment", row.jobTitle, row.company, row.startedAt.toISOString(), "", row.met, row.partial, row.notEvidenced, row.requirementCount]),
    ...report.applicationStages.map((row) => ["application_summary", "", "", "", row.stage, "", "", "", row.count]),
  ];
  return rows.map((row) => row.map(quote).join(",")).join("\r\n");
}

export async function listAdminAudit(limit = 100) {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  return db.select({ id: auditLogs.id, actorUserId: auditLogs.actorUserId, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, details: auditLogs.details, createdAt: auditLogs.createdAt })
    .from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(safeLimit);
}
