import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  date,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const id = (name = "id") => char(name, { length: 36 });
const createdAt = () => timestamp("created_at").defaultNow().notNull();
const updatedAt = () => timestamp("updated_at").defaultNow().onUpdateNow().notNull();

export const users = mysqlTable("users", {
  id: id().primaryKey(),
  openId: varchar("open_id", { length: 191 }).notNull(),
  email: varchar("email", { length: 320 }),
  displayName: varchar("display_name", { length: 160 }).notNull().default("Student"),
  role: mysqlEnum("role", ["student", "admin"]).notNull().default("student"),
  accountStatus: mysqlEnum("account_status", ["active", "disabled"]).notNull().default("active"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_users_open_id").on(table.openId),
  uniqueIndex("uq_users_email").on(table.email),
  index("ix_users_role_status").on(table.role, table.accountStatus),
]);

export const studentProfiles = mysqlTable("student_profiles", {
  userId: id("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  college: varchar("college", { length: 190 }),
  degree: varchar("degree", { length: 100 }),
  branch: varchar("branch", { length: 100 }),
  graduationYear: smallint("graduation_year", { unsigned: true }),
  cgpa: decimal("cgpa", { precision: 4, scale: 2 }),
  backlogCount: smallint("backlog_count", { unsigned: true }),
  githubUrl: varchar("github_url", { length: 512 }),
  linkedinUrl: varchar("linkedin_url", { length: 512 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  check("ck_profiles_cgpa", sql`${table.cgpa} is null or (${table.cgpa} >= 0 and ${table.cgpa} <= 10)`),
  check("ck_profiles_year", sql`${table.graduationYear} is null or (${table.graduationYear} between 1900 and 2200)`),
  check("ck_profiles_backlogs", sql`${table.backlogCount} is null or ${table.backlogCount} >= 0`),
]);

export const jobs = mysqlTable("jobs", {
  id: id().primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  company: varchar("company", { length: 190 }).notNull(),
  location: varchar("location", { length: 160 }),
  description: text("description").notNull(),
  jobStatus: mysqlEnum("job_status", ["draft", "open", "closed"]).notNull().default("draft"),
  createdBy: id("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_jobs_slug").on(table.slug),
  index("ix_jobs_status_created").on(table.jobStatus, table.createdAt),
  index("ix_jobs_company").on(table.company),
]);

export const jobEligibilityRules = mysqlTable("job_eligibility_rules", {
  id: id().primaryKey(),
  jobId: id("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  ruleKey: varchar("rule_key", { length: 64 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  operator: mysqlEnum("operator", ["min", "max", "eq", "in"]).notNull(),
  expectedValue: json("expected_value").$type<unknown>().notNull(),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("uq_eligibility_job_key").on(table.jobId, table.ruleKey),
  index("ix_eligibility_job").on(table.jobId),
]);

export const jobRequirements = mysqlTable("job_requirements", {
  id: id().primaryKey(),
  jobId: id("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  requirementKind: mysqlEnum("requirement_kind", ["skill", "experience", "certification", "project"]).notNull().default("skill"),
  description: text("description"),
  requiredFlag: boolean("required_flag").notNull().default(true),
  position: smallint("position", { unsigned: true }).notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_requirements_job_name").on(table.jobId, table.name),
  index("ix_requirements_job_position").on(table.jobId, table.position),
]);

export const studentSkills = mysqlTable("student_skills", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 140 }).notNull(),
  proficiency: mysqlEnum("proficiency", ["beginner", "intermediate", "advanced"]).notNull().default("beginner"),
  archivedAt: timestamp("archived_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_skills_user_name").on(table.userId, table.name),
  index("ix_skills_user").on(table.userId),
]);

export const studentCertifications = mysqlTable("student_certifications", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 190 }).notNull(),
  issuer: varchar("issuer", { length: 190 }),
  issuedOn: date("issued_on", { mode: "string" }),
  expiresOn: date("expires_on", { mode: "string" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_certifications_user_name").on(table.userId, table.name),
  index("ix_certifications_user").on(table.userId),
]);

export const projects = mysqlTable("projects", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 190 }).notNull(),
  description: text("description").notNull(),
  repositoryUrl: varchar("repository_url", { length: 512 }),
  liveUrl: varchar("live_url", { length: 512 }),
  archivedAt: timestamp("archived_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("ix_projects_user_updated").on(table.userId, table.updatedAt)]);

export const resumes = mysqlTable("resumes", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  byteSize: int("byte_size", { unsigned: true }).notNull(),
  objectKey: varchar("object_key", { length: 512 }).notNull(),
  fileStatus: mysqlEnum("file_status", ["pending", "active", "deleted"]).notNull().default("pending"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  uniqueIndex("uq_resumes_object_key").on(table.objectKey),
  check("ck_resumes_pdf", sql`${table.contentType} = 'application/pdf'`),
  check("ck_resumes_size", sql`${table.byteSize} > 0 and ${table.byteSize} <= 10485760`),
  index("ix_resumes_user_status").on(table.userId, table.fileStatus, table.uploadedAt),
]);

export const evidenceSources = mysqlTable("evidence_sources", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceType: mysqlEnum("source_type", ["resume", "project", "skill", "external"]).notNull(),
  title: varchar("title", { length: 190 }).notNull(),
  excerpt: text("excerpt").notNull(),
  sourceUrl: varchar("source_url", { length: 512 }),
  sourceStatus: mysqlEnum("source_status", ["active", "deleted"]).notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("ix_evidence_user_status").on(table.userId, table.sourceStatus, table.createdAt),
  index("ix_evidence_type").on(table.sourceType),
]);

export const evidenceResumeSources = mysqlTable("evidence_resume_sources", {
  evidenceId: id("evidence_id").primaryKey().references(() => evidenceSources.id, { onDelete: "cascade" }),
  resumeId: id("resume_id").notNull().references(() => resumes.id, { onDelete: "cascade" }),
}, (table) => [index("ix_ers_resume").on(table.resumeId)]);

export const evidenceProjectSources = mysqlTable("evidence_project_sources", {
  evidenceId: id("evidence_id").primaryKey().references(() => evidenceSources.id, { onDelete: "cascade" }),
  projectId: id("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
}, (table) => [index("ix_eps_project").on(table.projectId)]);

export const evidenceSkillSources = mysqlTable("evidence_skill_sources", {
  evidenceId: id("evidence_id").primaryKey().references(() => evidenceSources.id, { onDelete: "cascade" }),
  skillId: id("skill_id").notNull().references(() => studentSkills.id, { onDelete: "cascade" }),
}, (table) => [index("ix_ess_skill").on(table.skillId)]);

export const evidenceMatches = mysqlTable("evidence_matches", {
  id: id().primaryKey(),
  evidenceId: id("evidence_id").notNull().references(() => evidenceSources.id, { onDelete: "cascade" }),
  requirementId: id("requirement_id").notNull().references(() => jobRequirements.id, { onDelete: "cascade" }),
  createdBy: id("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  reviewStatus: mysqlEnum("review_status", ["pending", "accepted", "partial", "rejected"]).notNull().default("pending"),
  reviewNote: varchar("review_note", { length: 1000 }),
  reviewedBy: id("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_matches_evidence_requirement").on(table.evidenceId, table.requirementId),
  index("ix_matches_requirement_review").on(table.requirementId, table.reviewStatus),
]);

export const assessments = mysqlTable("assessments", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: id("job_id").notNull().references(() => jobs.id, { onDelete: "restrict" }),
  assessmentStatus: mysqlEnum("assessment_status", ["in_progress", "completed"]).notNull().default("completed"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("ix_assessments_user_date").on(table.userId, table.startedAt),
  index("ix_assessments_job").on(table.jobId),
]);

export const assessmentEligibilityResults = mysqlTable("assessment_eligibility_results", {
  id: id().primaryKey(),
  assessmentId: id("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  ruleId: id("rule_id").notNull().references(() => jobEligibilityRules.id, { onDelete: "restrict" }),
  actualValue: json("actual_value").$type<unknown>(),
  passStatus: mysqlEnum("pass_status", ["pass", "fail", "missing"]).notNull(),
  evaluatedAt: timestamp("evaluated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_assessment_eligibility_rule").on(table.assessmentId, table.ruleId),
  index("ix_eligibility_result_assessment").on(table.assessmentId),
]);

export const assessmentResults = mysqlTable("assessment_results", {
  id: id().primaryKey(),
  assessmentId: id("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  requirementId: id("requirement_id").notNull().references(() => jobRequirements.id, { onDelete: "restrict" }),
  verdict: mysqlEnum("verdict", ["MET", "PARTIAL", "NOT EVIDENCED"]).notNull(),
  rationale: varchar("rationale", { length: 1000 }).notNull(),
  evidenceCount: smallint("evidence_count", { unsigned: true }).notNull().default(0),
  createdAt: createdAt(),
}, (table) => [
  uniqueIndex("uq_results_assessment_requirement").on(table.assessmentId, table.requirementId),
  index("ix_results_requirement_verdict").on(table.requirementId, table.verdict),
]);

export const assessmentResultEvidence = mysqlTable("assessment_result_evidence", {
  resultId: id("result_id").notNull().references(() => assessmentResults.id, { onDelete: "cascade" }),
  evidenceId: id("evidence_id").notNull().references(() => evidenceSources.id, { onDelete: "restrict" }),
}, (table) => [
  primaryKey({ columns: [table.resultId, table.evidenceId] }),
  index("ix_are_evidence").on(table.evidenceId),
]);

export const roadmapActions = mysqlTable("roadmap_actions", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requirementId: id("requirement_id").references(() => jobRequirements.id, { onDelete: "set null" }),
  sourceAssessmentId: id("source_assessment_id").references(() => assessments.id, { onDelete: "set null" }),
  title: varchar("title", { length: 220 }).notNull(),
  effort: mysqlEnum("effort", ["small", "medium", "large"]).notNull().default("medium"),
  requiredEvidence: text("required_evidence"),
  actionStatus: mysqlEnum("action_status", ["not_started", "in_progress", "completed"]).notNull().default("not_started"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("ix_roadmap_user_status").on(table.userId, table.actionStatus, table.createdAt)]);

export const applications = mysqlTable("applications", {
  id: id().primaryKey(),
  userId: id("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: id("job_id").notNull().references(() => jobs.id, { onDelete: "restrict" }),
  applicationStage: mysqlEnum("application_stage", ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"]).notNull().default("saved"),
  appliedOn: date("applied_on", { mode: "string" }),
  notes: text("notes"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("uq_applications_user_job").on(table.userId, table.jobId),
  index("ix_applications_user_stage").on(table.userId, table.applicationStage, table.updatedAt),
  index("ix_applications_job").on(table.jobId),
]);

export const resources = mysqlTable("resources", {
  id: id().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  resourceUrl: varchar("resource_url", { length: 512 }).notNull(),
  visibility: mysqlEnum("visibility", ["draft", "published", "archived"]).notNull().default("draft"),
  createdBy: id("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("ix_resources_visibility_category").on(table.visibility, table.category)]);

export const auditLogs = mysqlTable("audit_logs", {
  id: id().primaryKey(),
  actorUserId: id("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: id("entity_id"),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
}, (table) => [
  index("ix_audit_actor_date").on(table.actorUserId, table.createdAt),
  index("ix_audit_entity").on(table.entityType, table.entityId, table.createdAt),
  index("ix_audit_date").on(table.createdAt),
]);
