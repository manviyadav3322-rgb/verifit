import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { jobRequirements, jobs } from "@/db/schema";

export async function listOpenRequirements() {
  return db.select({ id: jobRequirements.id, jobId: jobRequirements.jobId, name: jobRequirements.name, requirementKind: jobRequirements.requirementKind, requiredFlag: jobRequirements.requiredFlag, jobTitle: jobs.title, company: jobs.company })
    .from(jobRequirements)
    .innerJoin(jobs, eq(jobs.id, jobRequirements.jobId))
    .where(eq(jobs.jobStatus, "open"))
    .orderBy(asc(jobs.title), asc(jobRequirements.position), asc(jobRequirements.name))
    .limit(1000);
}
