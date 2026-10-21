import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { jobEligibilityRules, jobRequirements } from "@/db/schema";

export async function createJobRequirement(jobId: string, input: { name: string; requirementKind: "skill" | "experience" | "certification" | "project"; description?: string; requiredFlag: boolean; position: number }) {
  const id = randomUUID();
  try {
    await db.insert(jobRequirements).values({ id, jobId, name: input.name, requirementKind: input.requirementKind, description: input.description || null, requiredFlag: input.requiredFlag, position: input.position });
    return id;
  } catch {
    return null;
  }
}

export async function deleteJobRequirement(requirementId: string, jobId: string) {
  try {
    await db.delete(jobRequirements).where(and(eq(jobRequirements.id, requirementId), eq(jobRequirements.jobId, jobId)));
    return true;
  } catch {
    return false;
  }
}

export async function createEligibilityRule(jobId: string, input: { ruleKey: string; label: string; operator: "min" | "max" | "eq" | "in"; expectedValue: unknown }) {
  const id = randomUUID();
  try {
    await db.insert(jobEligibilityRules).values({ id, jobId, ...input });
    return id;
  } catch {
    return null;
  }
}

export async function deleteEligibilityRule(ruleId: string, jobId: string) {
  try {
    await db.delete(jobEligibilityRules).where(and(eq(jobEligibilityRules.id, ruleId), eq(jobEligibilityRules.jobId, jobId)));
    return true;
  } catch {
    return false;
  }
}
