import "server-only";

import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { assessmentEligibilityResults, assessmentResultEvidence, assessmentResults, assessments, evidenceMatches, evidenceSources, jobEligibilityRules, jobRequirements, jobs } from "@/db/schema";
import { getProfile } from "@/lib/data/profile";
import { getJob } from "@/lib/data/jobs";
import { recordAudit } from "@/lib/data/audit";

function actualForRule(ruleKey: string, profile: Awaited<ReturnType<typeof getProfile>>): unknown {
  switch (ruleKey.toLowerCase()) {
    case "cgpa": return profile.cgpa ? Number(profile.cgpa) : null;
    case "branch": return profile.branch || null;
    case "graduation_year":
    case "graduationyear": return profile.graduationYear ? Number(profile.graduationYear) : null;
    case "backlogs":
    case "backlog_count": return profile.backlogCount ? Number(profile.backlogCount) : null;
    case "degree": return profile.degree || null;
    case "college": return profile.college || null;
    default: return null;
  }
}

function evaluate(rule: { ruleKey: string; operator: string; expectedValue: unknown }, profile: Awaited<ReturnType<typeof getProfile>>) {
  const actualValue = actualForRule(rule.ruleKey, profile);
  if (actualValue === null || actualValue === undefined || actualValue === "") return { actualValue: null, status: "missing" as const };
  const expected = rule.expectedValue;
  let matched = false;
  if (rule.operator === "min") matched = Number(actualValue) >= Number(expected);
  else if (rule.operator === "max") matched = Number(actualValue) <= Number(expected);
  else if (rule.operator === "in") matched = Array.isArray(expected) && expected.map((value) => String(value).toLowerCase()).includes(String(actualValue).toLowerCase());
  else matched = String(actualValue).trim().toLowerCase() === String(expected).trim().toLowerCase();
  return { actualValue, status: matched ? "pass" as const : "fail" as const };
}

export async function evaluateJobEligibility(userId: string, jobId: string) {
  const [job, profile] = await Promise.all([getJob(jobId), getProfile(userId)]);
  if (!job) return null;
  const results = job.rules.map((rule) => ({ id: rule.id, ruleKey: rule.ruleKey, label: rule.label, operator: rule.operator, expectedValue: rule.expectedValue, ...evaluate(rule, profile) }));
  return { job, results, summary: { pass: results.filter((item) => item.status === "pass").length, fail: results.filter((item) => item.status === "fail").length, missing: results.filter((item) => item.status === "missing").length, total: results.length } };
}

export async function createAssessment(userId: string, jobId: string) {
  const [job, profile] = await Promise.all([getJob(jobId), getProfile(userId)]);
  if (!job) return null;
  const eligibility = job.rules.map((rule) => ({ rule, ...evaluate(rule, profile) }));
  const requirementIds = job.requirements.map((requirement) => requirement.id);
  const evidence = requirementIds.length ? await db.select({
    requirementId: evidenceMatches.requirementId,
    evidenceId: evidenceSources.id,
    reviewStatus: evidenceMatches.reviewStatus,
  }).from(evidenceMatches)
    .innerJoin(evidenceSources, eq(evidenceSources.id, evidenceMatches.evidenceId))
    .where(and(inArray(evidenceMatches.requirementId, requirementIds), eq(evidenceSources.userId, userId), eq(evidenceSources.sourceStatus, "active"), inArray(evidenceMatches.reviewStatus, ["pending", "partial", "accepted"]))) : [];
  const byRequirement = new Map<string, typeof evidence>();
  for (const item of evidence) byRequirement.set(item.requirementId, [...(byRequirement.get(item.requirementId) ?? []), item]);
  const resultRows = job.requirements.map((requirement) => {
    const sources = byRequirement.get(requirement.id) ?? [];
    const verdict = sources.some((source) => source.reviewStatus === "accepted") ? "MET" as const : sources.length ? "PARTIAL" as const : "NOT EVIDENCED" as const;
    const rationale = verdict === "MET" ? "At least one linked evidence item has been accepted for this requirement." : verdict === "PARTIAL" ? "Relevant evidence is linked but is still pending review or has been marked partial." : "No supporting evidence was found in the current materials.";
    return { requirement, sources, verdict, rationale };
  });

  const assessmentId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(assessments).values({ id: assessmentId, userId, jobId, assessmentStatus: "completed", completedAt: new Date() });
    if (eligibility.length) await tx.insert(assessmentEligibilityResults).values(eligibility.map(({ rule, actualValue, status }) => ({ id: randomUUID(), assessmentId, ruleId: rule.id, actualValue: actualValue ?? null, passStatus: status })));
    for (const row of resultRows) {
      const resultId = randomUUID();
      await tx.insert(assessmentResults).values({ id: resultId, assessmentId, requirementId: row.requirement.id, verdict: row.verdict, rationale: row.rationale, evidenceCount: row.sources.length });
      if (row.sources.length) await tx.insert(assessmentResultEvidence).values(row.sources.map((source) => ({ resultId, evidenceId: source.evidenceId })));
    }
  });
  await recordAudit(userId, "assessment.completed", "assessment", assessmentId, { jobId });
  return getAssessmentResult(userId, assessmentId);
}

export async function getAssessmentResult(userId: string, assessmentId?: string) {
  const [assessment] = await db.select({ id: assessments.id, jobId: assessments.jobId, startedAt: assessments.startedAt, completedAt: assessments.completedAt, title: jobs.title, company: jobs.company, location: jobs.location })
    .from(assessments).innerJoin(jobs, eq(jobs.id, assessments.jobId))
    .where(assessmentId ? and(eq(assessments.userId, userId), eq(assessments.id, assessmentId)) : eq(assessments.userId, userId))
    .orderBy(desc(assessments.startedAt)).limit(1);
  if (!assessment) return null;
  const [results, eligibility] = await Promise.all([
    db.select({ resultId: assessmentResults.id, requirementId: assessmentResults.requirementId, requirementName: jobRequirements.name, requirementKind: jobRequirements.requirementKind, required: jobRequirements.requiredFlag, verdict: assessmentResults.verdict, rationale: assessmentResults.rationale, evidenceCount: assessmentResults.evidenceCount })
      .from(assessmentResults).innerJoin(jobRequirements, eq(jobRequirements.id, assessmentResults.requirementId)).where(eq(assessmentResults.assessmentId, assessment.id)).orderBy(jobRequirements.position, jobRequirements.name),
    db.select({ ruleId: assessmentEligibilityResults.ruleId, label: jobEligibilityRules.label, ruleKey: jobEligibilityRules.ruleKey, operator: jobEligibilityRules.operator, expectedValue: jobEligibilityRules.expectedValue, actualValue: assessmentEligibilityResults.actualValue, status: assessmentEligibilityResults.passStatus })
      .from(assessmentEligibilityResults).innerJoin(jobEligibilityRules, eq(jobEligibilityRules.id, assessmentEligibilityResults.ruleId)).where(eq(assessmentEligibilityResults.assessmentId, assessment.id)),
  ]);
  const evidenceRows = results.length ? await db.select({ resultId: assessmentResultEvidence.resultId, id: evidenceSources.id, title: evidenceSources.title, excerpt: evidenceSources.excerpt, sourceType: evidenceSources.sourceType, sourceUrl: evidenceSources.sourceUrl, sourceStatus: evidenceSources.sourceStatus })
    .from(assessmentResultEvidence).innerJoin(evidenceSources, eq(evidenceSources.id, assessmentResultEvidence.evidenceId)).where(inArray(assessmentResultEvidence.resultId, results.map((row) => row.resultId))) : [];
  const byResult = new Map<string, typeof evidenceRows>();
  for (const item of evidenceRows) byResult.set(item.resultId, [...(byResult.get(item.resultId) ?? []), item]);
  const expanded = results.map(({ resultId, ...row }) => ({ ...row, evidence: byResult.get(resultId) ?? [] }));
  return {
    id: assessment.id,
    job: { id: assessment.jobId, title: assessment.title, company: assessment.company, location: assessment.location },
    startedAt: assessment.startedAt,
    completedAt: assessment.completedAt,
    eligibility,
    eligibilitySummary: { passed: eligibility.filter((item) => item.status === "pass").length, failed: eligibility.filter((item) => item.status === "fail").length, missing: eligibility.filter((item) => item.status === "missing").length, total: eligibility.length },
    results: expanded,
    summary: {
      total: expanded.length,
      met: expanded.filter((item) => item.verdict === "MET").length,
      partial: expanded.filter((item) => item.verdict === "PARTIAL").length,
      notEvidenced: expanded.filter((item) => item.verdict === "NOT EVIDENCED").length,
      coverage: expanded.filter((item) => item.verdict !== "NOT EVIDENCED").length,
    },
  };
}

export async function listAssessments(userId: string) {
  return db.select({ id: assessments.id, jobId: assessments.jobId, title: jobs.title, company: jobs.company, startedAt: assessments.startedAt, completedAt: assessments.completedAt })
    .from(assessments).innerJoin(jobs, eq(jobs.id, assessments.jobId)).where(eq(assessments.userId, userId)).orderBy(desc(assessments.startedAt)).limit(100);
}

export async function listEvidenceGaps(userId: string) {
  const result = await getAssessmentResult(userId);
  return result ? { assessment: { id: result.id, job: result.job, startedAt: result.startedAt }, gaps: result.results.filter((item) => item.verdict !== "MET") } : { assessment: null, gaps: [] };
}
