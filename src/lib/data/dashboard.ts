import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { applications, assessments, jobs } from "@/db/schema";
import { getProfile } from "@/lib/data/profile";
import { getAssessmentResult } from "@/lib/data/assessments";

export async function getDashboard(userId: string) {
  const [profile, openJobs, applicationRows, latest, assessmentCountRows] = await Promise.all([
    getProfile(userId),
    db.select({ count: sql<number>`count(*)` }).from(jobs).where(eq(jobs.jobStatus, "open")),
    db.select({ stage: applications.applicationStage, count: sql<number>`count(*)` }).from(applications).where(eq(applications.userId, userId)).groupBy(applications.applicationStage),
    db.select({ id: assessments.id, startedAt: assessments.startedAt }).from(assessments).where(eq(assessments.userId, userId)).orderBy(desc(assessments.startedAt)).limit(1),
    db.select({ count: sql<number>`count(*)` }).from(assessments).where(eq(assessments.userId, userId)),
  ]);
  const latestAssessment = latest[0] ? await getAssessmentResult(userId, latest[0].id) : null;
  const applicationCount = applicationRows.reduce((sum, row) => sum + Number(row.count), 0);
  const activeApplications = applicationRows.filter((row) => !["rejected", "withdrawn", "offer"].includes(row.stage)).reduce((sum, row) => sum + Number(row.count), 0);
  return {
    profile,
    stats: {
      openJobs: Number(openJobs[0]?.count ?? 0),
      applicationCount,
      activeApplications,
      totalAssessments: Number(assessmentCountRows[0]?.count ?? 0),
      latestAssessmentAt: latest[0]?.startedAt ?? null,
      requirements: latestAssessment?.summary ?? null,
    },
    latestAssessment,
  };
}
