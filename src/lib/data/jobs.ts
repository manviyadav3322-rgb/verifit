import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { jobEligibilityRules, jobRequirements, jobs } from "@/db/schema";

export type JobDraft = {
  title: string;
  company: string;
  location?: string;
  description: string;
  jobStatus?: "draft" | "open" | "closed";
  rules?: Array<{ ruleKey: string; label: string; operator: "min" | "max" | "eq" | "in"; expectedValue: unknown }>;
  requirements?: Array<{ name: string; requirementKind?: "skill" | "experience" | "certification" | "project"; description?: string; requiredFlag?: boolean }>;
};

function makeSlug(title: string, company: string) {
  const base = `${company}-${title}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110) || "job";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function listJobs(options: { query?: string; status?: string; sort?: string; direction?: string; admin?: boolean } = {}) {
  const conditions: SQL[] = [];
  if (!options.admin) conditions.push(eq(jobs.jobStatus, "open"));
  else if (options.status && ["draft", "open", "closed"].includes(options.status)) conditions.push(eq(jobs.jobStatus, options.status as "draft" | "open" | "closed"));
  if (options.query?.trim()) {
    const term = `%${options.query.trim().slice(0, 100)}%`;
    conditions.push(or(like(jobs.title, term), like(jobs.company, term), like(jobs.location, term))!);
  }
  const order = options.sort === "title" ? asc(jobs.title) : options.sort === "company" ? asc(jobs.company) : options.direction === "asc" ? asc(jobs.createdAt) : desc(jobs.createdAt);
  return db.select().from(jobs).where(conditions.length ? and(...conditions) : undefined).orderBy(order).limit(100);
}

export async function getJob(jobId: string, includeHidden = false) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job || (!includeHidden && job.jobStatus !== "open")) return null;
  const [rules, requirements] = await Promise.all([
    db.select().from(jobEligibilityRules).where(eq(jobEligibilityRules.jobId, jobId)).orderBy(asc(jobEligibilityRules.createdAt)),
    db.select().from(jobRequirements).where(eq(jobRequirements.jobId, jobId)).orderBy(asc(jobRequirements.position), asc(jobRequirements.name)),
  ]);
  return { ...job, rules, requirements };
}

export async function createJob(input: JobDraft, adminId: string) {
  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(jobs).values({ id, slug: makeSlug(input.title, input.company), title: input.title, company: input.company, location: input.location || null, description: input.description, jobStatus: input.jobStatus ?? "draft", createdBy: adminId });
    if (input.rules?.length) await tx.insert(jobEligibilityRules).values(input.rules.map((rule) => ({ id: randomUUID(), jobId: id, ...rule })));
    if (input.requirements?.length) await tx.insert(jobRequirements).values(input.requirements.map((requirement, index) => ({ id: randomUUID(), jobId: id, name: requirement.name, requirementKind: requirement.requirementKind ?? "skill", description: requirement.description || null, requiredFlag: requirement.requiredFlag ?? true, position: index })));
  });
  return getJob(id, true);
}

export async function updateJob(jobId: string, input: Partial<JobDraft>) {
  const values = {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.company !== undefined ? { company: input.company } : {}),
    ...(input.location !== undefined ? { location: input.location || null } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.jobStatus !== undefined ? { jobStatus: input.jobStatus } : {}),
  };
  if (Object.keys(values).length) await db.update(jobs).set(values).where(eq(jobs.id, jobId));
  return getJob(jobId, true);
}

export async function closeJob(jobId: string) {
  await db.update(jobs).set({ jobStatus: "closed" }).where(eq(jobs.id, jobId));
  return getJob(jobId, true);
}
