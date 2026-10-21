import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApi, jsonError } from "@/lib/policies/guards";
import { recordAudit } from "@/lib/data/audit";
import { listJobs, getJob, createJob, updateJob, closeJob } from "@/lib/data/jobs";
import { createEligibilityRule, createJobRequirement, deleteEligibilityRule, deleteJobRequirement } from "@/lib/data/job-admin";
import { listSkills, createSkill, updateSkill, archiveSkill, listProjects, createProject, updateProject, archiveProject, listEvidence, createEvidence, updateEvidence, deleteEvidence, linkEvidenceToRequirement } from "@/lib/data/portfolio";
import { createAssessment, evaluateJobEligibility, getAssessmentResult, listAssessments, listEvidenceGaps } from "@/lib/data/assessments";
import { createApplication, createRoadmapAction, deleteApplication, deleteRoadmapAction, listApplications, listRoadmapActions, updateApplication, updateRoadmapAction } from "@/lib/data/workflows";
import { beginResumeUpload, completeResumeUpload, deleteResume, getResumeDownloadUrl, listResumes } from "@/lib/data/resumes";
import { getUserHistory, getUserReport, listAdminAudit, reportToCsv } from "@/lib/data/reports";
import { getDashboard } from "@/lib/data/dashboard";
import { archiveResource, createResource, listEvidenceForReview, listResources, listUsers, reviewEvidenceMatch, updateResource, updateUserAccess } from "@/lib/data/admin";
import { listOpenRequirements } from "@/lib/data/requirements";

const uuid = z.string().uuid();
const queryText = (value: string | null) => (value ?? "").slice(0, 100);
const urlField = z.string().trim().max(512).refine((value) => !value || /^https?:\/\//i.test(value), "Use an http(s) URL or leave this field empty.");
const skillSchema = z.object({ name: z.string().trim().min(1).max(140), proficiency: z.enum(["beginner", "intermediate", "advanced"]).default("beginner") }).strict();
const skillPatchSchema = skillSchema.partial();
const projectSchema = z.object({ title: z.string().trim().min(1).max(190), description: z.string().trim().min(1).max(10000), repositoryUrl: urlField.optional(), liveUrl: urlField.optional() }).strict();
const projectPatchSchema = projectSchema.partial();
const evidenceSchema = z.object({ sourceType: z.enum(["resume", "project", "skill", "external"]), title: z.string().trim().min(1).max(190), excerpt: z.string().trim().min(1).max(10000), sourceUrl: urlField.optional(), sourceRefId: uuid.optional(), requirementId: uuid.optional() }).strict();
const evidencePatchSchema = z.object({ title: z.string().trim().min(1).max(190).optional(), excerpt: z.string().trim().min(1).max(10000).optional(), sourceUrl: urlField.optional() }).strict();
const roadmapSchema = z.object({ title: z.string().trim().min(1).max(220), effort: z.enum(["small", "medium", "large"]).default("medium"), requiredEvidence: z.string().trim().max(2000).optional(), requirementId: uuid.optional(), sourceAssessmentId: uuid.optional() }).strict();
const roadmapPatchSchema = z.object({ title: z.string().trim().min(1).max(220).optional(), effort: z.enum(["small", "medium", "large"]).optional(), requiredEvidence: z.string().trim().max(2000).optional(), actionStatus: z.enum(["not_started", "in_progress", "completed"]).optional() }).strict();
const applicationSchema = z.object({ jobId: uuid }).strict();
const applicationPatchSchema = z.object({ applicationStage: z.enum(["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"]).optional(), appliedOn: z.string().date().nullable().optional(), notes: z.string().max(5000).nullable().optional() }).strict();
const expectedValue = z.union([z.string().max(500), z.number().finite(), z.array(z.string().max(100)).max(40)]);
const jobSchema = z.object({
  title: z.string().trim().min(1).max(220), company: z.string().trim().min(1).max(190), location: z.string().trim().max(190).optional(), description: z.string().trim().min(1).max(15000), jobStatus: z.enum(["draft", "open", "closed"]).default("draft"),
  rules: z.array(z.object({ ruleKey: z.string().trim().min(1).max(80), label: z.string().trim().min(1).max(190), operator: z.enum(["min", "max", "eq", "in"]), expectedValue }).strict()).max(30).optional(),
  requirements: z.array(z.object({ name: z.string().trim().min(1).max(140), requirementKind: z.enum(["skill", "experience", "certification", "project"]).default("skill"), description: z.string().trim().max(3000).optional(), requiredFlag: z.boolean().default(true) }).strict()).max(100).optional(),
}).strict();
const jobPatchSchema = z.object({ title: z.string().trim().min(1).max(220).optional(), company: z.string().trim().min(1).max(190).optional(), location: z.string().trim().max(190).optional(), description: z.string().trim().min(1).max(15000).optional(), jobStatus: z.enum(["draft", "open", "closed"]).optional() }).strict();
const resourceSchema = z.object({ title: z.string().trim().min(1).max(220), category: z.string().trim().min(1).max(100), description: z.string().trim().min(1).max(5000), resourceUrl: urlField.refine((value) => Boolean(value), "Enter a resource URL."), visibility: z.enum(["draft", "published", "archived"]).default("draft") }).strict();
const resourcePatchSchema = resourceSchema.partial();

function parse<T>(schema: z.ZodType<T>, value: unknown): T | NextResponse {
  const result = schema.safeParse(value);
  return result.success ? result.data : NextResponse.json({ error: "Check the submitted fields and try again.", issues: result.error.flatten().fieldErrors }, { status: 400 });
}

async function body(request: Request) {
  return request.json().catch(() => null) as Promise<unknown>;
}

async function perform(request: NextRequest) {
  let segments: string[];
  try { segments = request.nextUrl.pathname.replace(/^\/api\/data\/?/, "").split("/").filter(Boolean).map(decodeURIComponent); }
  catch { return jsonError("Invalid resource path.", 400); }
  const method = request.method.toUpperCase();
  const adminRoute = segments[0] === "admin";
  const auth = await authorizeApi(request, adminRoute ? ["admin"] : undefined);
  if (auth.response) return auth.response;
  const actor = auth.user;
  const query = request.nextUrl.searchParams;
  const badId = () => jsonError("Invalid resource ID.", 400);
  const parsedId = (value?: string) => uuid.safeParse(value);

  if (method === "GET") {
    if (segments.length === 1 && segments[0] === "dashboard") return NextResponse.json(await getDashboard(actor.id), { headers: { "Cache-Control": "no-store" } });
    if (segments.length === 1 && segments[0] === "jobs") return NextResponse.json({ jobs: await listJobs({ query: queryText(query.get("q")), sort: query.get("sort") ?? "newest", direction: query.get("direction") ?? "desc" }) });
    if (segments.length === 1 && segments[0] === "requirements") return NextResponse.json({ requirements: await listOpenRequirements() });
    if (segments.length === 2 && segments[0] === "jobs") {
      if (!parsedId(segments[1]).success) return badId();
      const job = await getJob(segments[1]);
      return job ? NextResponse.json({ job }) : jsonError("Job not found.", 404);
    }
    if (segments.length === 1 && segments[0] === "eligibility") {
      const jobId = query.get("jobId"); if (!parsedId(jobId ?? undefined).success) return badId();
      const eligibility = await evaluateJobEligibility(actor.id, jobId!);
      return eligibility ? NextResponse.json(eligibility) : jsonError("Job not found.", 404);
    }
    if (segments.length === 1 && segments[0] === "assessments") {
      const id = query.get("id");
      if (id) { if (!parsedId(id).success) return badId(); const result = await getAssessmentResult(actor.id, id); return result ? NextResponse.json({ result }) : jsonError("Assessment not found.", 404); }
      return NextResponse.json({ assessments: await listAssessments(actor.id) });
    }
    if (segments.join("/") === "assessments/latest") { const result = await getAssessmentResult(actor.id); return NextResponse.json({ result }); }
    if (segments.join("/") === "gaps") return NextResponse.json(await listEvidenceGaps(actor.id));
    if (segments.join("/") === "skills") return NextResponse.json({ skills: await listSkills(actor.id, queryText(query.get("q")), query.get("sort") ?? "name") });
    if (segments.join("/") === "projects") return NextResponse.json({ projects: await listProjects(actor.id, queryText(query.get("q")), query.get("sort") ?? "updated") });
    if (segments.join("/") === "evidence") return NextResponse.json({ evidence: await listEvidence(actor.id, queryText(query.get("q")), query.get("sort") ?? "newest") });
    if (segments.join("/") === "roadmap") return NextResponse.json({ actions: await listRoadmapActions(actor.id) });
    if (segments.join("/") === "applications") return NextResponse.json({ applications: await listApplications(actor.id) });
    if (segments.join("/") === "history") return NextResponse.json(await getUserHistory(actor.id));
    if (segments.join("/") === "reports") return NextResponse.json(await getUserReport(actor.id));
    if (segments.join("/") === "export") {
      const report = await getUserReport(actor.id);
      const csv = reportToCsv(report);
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=verifit-report.csv", "Cache-Control": "no-store" } });
    }
    if (segments.join("/") === "resources") return NextResponse.json({ resources: await listResources(false) });
    if (segments.join("/") === "resumes") return NextResponse.json({ resumes: await listResumes(actor.id) });
    if (segments.length === 3 && segments[0] === "resumes" && segments[2] === "download") {
      if (!parsedId(segments[1]).success) return badId();
      const file = await getResumeDownloadUrl(actor.id, segments[1]);
      if (!file) return jsonError("Resume not found.", 404);
      const upstream = await fetch(file.url, { cache: "no-store" });
      if (!upstream.ok || !upstream.body) return jsonError("Resume bytes are not available in storage.", 502);
      const disposition = query.get("preview") === "1" ? "inline" : "attachment";
      return new NextResponse(upstream.body, { headers: { "Cache-Control": "private, no-store", "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`, "X-Content-Type-Options": "nosniff" } });
    }
    if (segments.join("/") === "admin/users") return NextResponse.json({ users: await listUsers() });
    if (segments.join("/") === "admin/evidence") return NextResponse.json({ evidence: await listEvidenceForReview() });
    if (segments.join("/") === "admin/audit") return NextResponse.json({ events: await listAdminAudit(Number(query.get("limit") ?? 100)) });
    if (segments.join("/") === "admin/resources") return NextResponse.json({ resources: await listResources(true) });
    if (segments.join("/") === "admin/jobs") return NextResponse.json({ jobs: await listJobs({ admin: true, status: query.get("status") ?? undefined, query: queryText(query.get("q")), sort: query.get("sort") ?? "newest" }) });
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "jobs") {
      if (!parsedId(segments[2]).success) return badId();
      const job = await getJob(segments[2], true);
      return job ? NextResponse.json({ job }) : jsonError("Job not found.", 404);
    }
    return jsonError("Resource not found.", 404);
  }

  if (method === "POST") {
    const input = await body(request);
    if (segments.join("/") === "assessments") {
      const parsed = parse(z.object({ jobId: uuid }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      const result = await createAssessment(actor.id, parsed.jobId); return result ? NextResponse.json({ result }, { status: 201 }) : jsonError("An open job is required to start an assessment.", 404);
    }
    if (segments.join("/") === "skills") {
      const parsed = parse(skillSchema, input); if (parsed instanceof NextResponse) return parsed;
      const skill = await createSkill(actor.id, parsed); await recordAudit(actor.id, "skill.created", "skill", skill.id); return NextResponse.json({ skill }, { status: 201 });
    }
    if (segments.join("/") === "projects") {
      const parsed = parse(projectSchema, input); if (parsed instanceof NextResponse) return parsed;
      const project = await createProject(actor.id, parsed); await recordAudit(actor.id, "project.created", "project", project.id); return NextResponse.json({ project }, { status: 201 });
    }
    if (segments.join("/") === "evidence") {
      const parsed = parse(evidenceSchema, input); if (parsed instanceof NextResponse) return parsed;
      const evidence = await createEvidence(actor.id, parsed); if (!evidence) return jsonError("The selected source or requirement is unavailable to this account.", 400);
      await recordAudit(actor.id, "evidence.created", "evidence", evidence.id); return NextResponse.json({ evidence }, { status: 201 });
    }
    if (segments.length === 3 && segments[0] === "evidence" && segments[2] === "matches") {
      if (!parsedId(segments[1]).success) return badId();
      const parsed = parse(z.object({ requirementId: uuid }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      const matchId = await linkEvidenceToRequirement(actor.id, segments[1], parsed.requirementId);
      return matchId ? NextResponse.json({ matchId }, { status: 201 }) : jsonError("Evidence or requirement is unavailable, or already linked.", 409);
    }
    if (segments.join("/") === "roadmap") {
      const parsed = parse(roadmapSchema, input); if (parsed instanceof NextResponse) return parsed;
      const action = await createRoadmapAction(actor.id, parsed); return action ? NextResponse.json({ action }, { status: 201 }) : jsonError("The selected assessment or requirement is unavailable.", 400);
    }
    if (segments.join("/") === "applications") {
      const parsed = parse(applicationSchema, input); if (parsed instanceof NextResponse) return parsed;
      const application = await createApplication(actor.id, parsed.jobId); return application ? NextResponse.json({ application }, { status: 201 }) : jsonError("Only an open job can be added.", 400);
    }
    if (segments.join("/") === "resumes") {
      const parsed = parse(z.object({ fileName: z.string().trim().min(1).max(255), contentType: z.string().max(100), byteSize: z.number().int().min(1).max(10485760) }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      try { return NextResponse.json(await beginResumeUpload(actor.id, parsed), { status: 201 }); }
      catch (error) { return jsonError(error instanceof Error ? error.message : "Resume upload could not start.", 400); }
    }
    if (segments.length === 3 && segments[0] === "resumes" && segments[2] === "complete") {
      if (!parsedId(segments[1]).success) return badId(); const resume = await completeResumeUpload(actor.id, segments[1]);
      if (resume) await recordAudit(actor.id, "resume.uploaded", "resume", resume.id); return resume ? NextResponse.json({ resume }) : jsonError("Pending resume not found.", 404);
    }
    if (segments.join("/") === "admin/jobs") {
      const parsed = parse(jobSchema, input); if (parsed instanceof NextResponse) return parsed;
      const job = await createJob(parsed, actor.id); if (job) await recordAudit(actor.id, "job.created", "job", job.id);
      return job ? NextResponse.json({ job }, { status: 201 }) : jsonError("Job could not be created.", 400);
    }
    if (segments.length === 4 && segments[0] === "admin" && segments[1] === "jobs" && segments[3] === "requirements") {
      if (!parsedId(segments[2]).success) return badId();
      const parsed = parse(z.object({ name: z.string().trim().min(1).max(140), requirementKind: z.enum(["skill", "experience", "certification", "project"]), description: z.string().trim().max(3000).optional(), requiredFlag: z.boolean().default(true), position: z.number().int().min(0).max(1000).default(0) }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      const id = await createJobRequirement(segments[2], parsed); return id ? NextResponse.json({ requirementId: id }, { status: 201 }) : jsonError("Requirement could not be added; check for duplicates.", 409);
    }
    if (segments.length === 4 && segments[0] === "admin" && segments[1] === "jobs" && segments[3] === "eligibility") {
      if (!parsedId(segments[2]).success) return badId();
      const parsed = parse(z.object({ ruleKey: z.string().trim().min(1).max(80), label: z.string().trim().min(1).max(190), operator: z.enum(["min", "max", "eq", "in"]), expectedValue }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      const id = await createEligibilityRule(segments[2], parsed); return id ? NextResponse.json({ ruleId: id }, { status: 201 }) : jsonError("Eligibility rule could not be added.", 400);
    }
    if (segments.join("/") === "admin/resources") {
      const parsed = parse(resourceSchema, input); if (parsed instanceof NextResponse) return parsed;
      return NextResponse.json({ resource: await createResource(actor.id, parsed) }, { status: 201 });
    }
    return jsonError("Resource not found.", 404);
  }

  if (method === "PUT" || method === "PATCH") {
    const input = await body(request);
    if (segments.length === 2 && segments[0] === "skills") {
      if (!parsedId(segments[1]).success) return badId(); const parsed = parse(skillPatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const skill = await updateSkill(actor.id, segments[1], parsed); return skill ? NextResponse.json({ skill }) : jsonError("Skill not found.", 404);
    }
    if (segments.length === 2 && segments[0] === "projects") {
      if (!parsedId(segments[1]).success) return badId(); const parsed = parse(projectPatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const project = await updateProject(actor.id, segments[1], parsed); return project ? NextResponse.json({ project }) : jsonError("Project not found.", 404);
    }
    if (segments.length === 2 && segments[0] === "evidence") {
      if (!parsedId(segments[1]).success) return badId(); const parsed = parse(evidencePatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const evidence = await updateEvidence(actor.id, segments[1], parsed); return evidence ? NextResponse.json({ evidence }) : jsonError("Evidence item not found.", 404);
    }
    if (segments.length === 2 && segments[0] === "roadmap") {
      if (!parsedId(segments[1]).success) return badId(); const parsed = parse(roadmapPatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const action = await updateRoadmapAction(actor.id, segments[1], parsed); return action ? NextResponse.json({ action }) : jsonError("Roadmap action not found.", 404);
    }
    if (segments.length === 2 && segments[0] === "applications") {
      if (!parsedId(segments[1]).success) return badId(); const parsed = parse(applicationPatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const application = await updateApplication(actor.id, segments[1], parsed); return application ? NextResponse.json({ application }) : jsonError("Application not found.", 404);
    }
    if (segments.length === 2 && segments[0] === "admin" && segments[1] === "users") return jsonError("User ID is required.", 400);
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "users") {
      if (!parsedId(segments[2]).success) return badId();
      const parsed = parse(z.object({ role: z.enum(["student", "admin"]).optional(), accountStatus: z.enum(["active", "disabled"]).optional() }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      try { const user = await updateUserAccess(actor.id, segments[2], parsed); return user ? NextResponse.json({ user }) : jsonError("User not found.", 404); }
      catch (error) { return jsonError(error instanceof Error ? error.message : "Access change failed.", 409); }
    }
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "jobs") {
      if (!parsedId(segments[2]).success) return badId(); const parsed = parse(jobPatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const job = await updateJob(segments[2], parsed); if (job) await recordAudit(actor.id, "job.updated", "job", segments[2]); return job ? NextResponse.json({ job }) : jsonError("Job not found.", 404);
    }
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "evidence") {
      if (!parsedId(segments[2]).success) return badId();
      const parsed = parse(z.object({ reviewStatus: z.enum(["accepted", "partial", "rejected"]), reviewNote: z.string().trim().max(1000).optional() }).strict(), input); if (parsed instanceof NextResponse) return parsed;
      const result = await reviewEvidenceMatch(actor.id, segments[2], parsed); return result ? NextResponse.json({ match: result }) : jsonError("Evidence match not found.", 404);
    }
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "resources") {
      if (!parsedId(segments[2]).success) return badId(); const parsed = parse(resourcePatchSchema, input); if (parsed instanceof NextResponse) return parsed;
      const resource = await updateResource(actor.id, segments[2], parsed); return resource ? NextResponse.json({ resource }) : jsonError("Resource not found.", 404);
    }
    return jsonError("Resource not found.", 404);
  }

  if (method === "DELETE") {
    if (segments.length === 2 && segments[0] === "skills") {
      if (!parsedId(segments[1]).success) return badId(); await archiveSkill(actor.id, segments[1]); await recordAudit(actor.id, "skill.archived", "skill", segments[1]); return NextResponse.json({ ok: true });
    }
    if (segments.length === 2 && segments[0] === "projects") {
      if (!parsedId(segments[1]).success) return badId(); await archiveProject(actor.id, segments[1]); await recordAudit(actor.id, "project.archived", "project", segments[1]); return NextResponse.json({ ok: true });
    }
    if (segments.length === 2 && segments[0] === "evidence") {
      if (!parsedId(segments[1]).success) return badId(); await deleteEvidence(actor.id, segments[1]); await recordAudit(actor.id, "evidence.deleted", "evidence", segments[1]); return NextResponse.json({ ok: true });
    }
    if (segments.length === 2 && segments[0] === "roadmap") {
      if (!parsedId(segments[1]).success) return badId(); await deleteRoadmapAction(actor.id, segments[1]); return NextResponse.json({ ok: true });
    }
    if (segments.length === 2 && segments[0] === "applications") {
      if (!parsedId(segments[1]).success) return badId(); await deleteApplication(actor.id, segments[1]); return NextResponse.json({ ok: true });
    }
    if (segments.length === 2 && segments[0] === "resumes") {
      if (!parsedId(segments[1]).success) return badId(); await deleteResume(actor.id, segments[1]); await recordAudit(actor.id, "resume.soft_deleted", "resume", segments[1]); return NextResponse.json({ ok: true, deletion: "soft" });
    }
    if (segments.length === 5 && segments[0] === "admin" && segments[1] === "jobs" && segments[3] === "requirements") {
      if (!parsedId(segments[2]).success || !parsedId(segments[4]).success) return badId(); const ok = await deleteJobRequirement(segments[4], segments[2]); return ok ? NextResponse.json({ ok: true }) : jsonError("Requirement is in use or was not found.", 409);
    }
    if (segments.length === 5 && segments[0] === "admin" && segments[1] === "jobs" && segments[3] === "eligibility") {
      if (!parsedId(segments[2]).success || !parsedId(segments[4]).success) return badId(); const ok = await deleteEligibilityRule(segments[4], segments[2]); return ok ? NextResponse.json({ ok: true }) : jsonError("Eligibility rule is in use or was not found.", 409);
    }
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "jobs") {
      if (!parsedId(segments[2]).success) return badId(); await closeJob(segments[2]); await recordAudit(actor.id, "job.closed", "job", segments[2]); return NextResponse.json({ ok: true, status: "closed" });
    }
    if (segments.length === 3 && segments[0] === "admin" && segments[1] === "resources") {
      if (!parsedId(segments[2]).success) return badId(); await archiveResource(actor.id, segments[2]); return NextResponse.json({ ok: true, visibility: "archived" });
    }
  }

  return jsonError("Method not allowed.", 405);
}

export async function GET(request: NextRequest) {
  try { return await perform(request); }
  catch (error) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") return jsonError("A record with these details already exists.", 409); console.error("VeriFit data request failed."); return jsonError("The request could not be completed.", 500); }
}
export async function POST(request: NextRequest) {
  try { return await perform(request); }
  catch (error) { if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") return jsonError("A record with these details already exists.", 409); console.error("VeriFit data request failed."); return jsonError("The request could not be completed.", 500); }
}
export async function PUT(request: NextRequest) {
  try { return await perform(request); }
  catch { console.error("VeriFit data request failed."); return jsonError("The request could not be completed.", 500); }
}
export async function PATCH(request: NextRequest) {
  try { return await perform(request); }
  catch { console.error("VeriFit data request failed."); return jsonError("The request could not be completed.", 500); }
}
export async function DELETE(request: NextRequest) {
  try { return await perform(request); }
  catch { console.error("VeriFit data request failed."); return jsonError("The request could not be completed.", 500); }
}
