CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id VARCHAR(191) NOT NULL PRIMARY KEY,
  checksum CHAR(64) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  open_id VARCHAR(191) NOT NULL,
  email VARCHAR(320) NULL,
  display_name VARCHAR(160) NOT NULL DEFAULT 'Student',
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  account_status ENUM('active','disabled') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_open_id UNIQUE (open_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX ix_users_role_status (role, account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  college VARCHAR(190) NULL,
  degree VARCHAR(100) NULL,
  branch VARCHAR(100) NULL,
  graduation_year SMALLINT UNSIGNED NULL,
  cgpa DECIMAL(4,2) NULL,
  backlog_count SMALLINT UNSIGNED NULL,
  github_url VARCHAR(512) NULL,
  linkedin_url VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_profiles_cgpa CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10)),
  CONSTRAINT ck_profiles_year CHECK (graduation_year IS NULL OR (graduation_year BETWEEN 1900 AND 2200)),
  CONSTRAINT ck_profiles_backlogs CHECK (backlog_count IS NULL OR backlog_count >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  slug VARCHAR(140) NOT NULL,
  title VARCHAR(160) NOT NULL,
  company VARCHAR(190) NOT NULL,
  location VARCHAR(160) NULL,
  description TEXT NOT NULL,
  job_status ENUM('draft','open','closed') NOT NULL DEFAULT 'draft',
  created_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_jobs_slug UNIQUE (slug),
  CONSTRAINT fk_jobs_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX ix_jobs_status_created (job_status, created_at),
  INDEX ix_jobs_company (company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_eligibility_rules (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  job_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  rule_key VARCHAR(64) NOT NULL,
  label VARCHAR(180) NOT NULL,
  operator ENUM('min','max','eq','in') NOT NULL,
  expected_value JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eligibility_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT uq_eligibility_job_key UNIQUE (job_id, rule_key),
  INDEX ix_eligibility_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS job_requirements (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  job_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(140) NOT NULL,
  requirement_kind ENUM('skill','experience','certification','project') NOT NULL DEFAULT 'skill',
  description TEXT NULL,
  required_flag BOOLEAN NOT NULL DEFAULT TRUE,
  position SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requirements_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT uq_requirements_job_name UNIQUE (job_id, name),
  INDEX ix_requirements_job_position (job_id, position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_skills (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(140) NOT NULL,
  proficiency ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_skills_user_name UNIQUE (user_id, name),
  INDEX ix_skills_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS student_certifications (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(190) NOT NULL,
  issuer VARCHAR(190) NULL,
  issued_on DATE NULL,
  expires_on DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_certifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_certifications_user_name UNIQUE (user_id, name),
  INDEX ix_certifications_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  repository_url VARCHAR(512) NULL,
  live_url VARCHAR(512) NULL,
  archived_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX ix_projects_user_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resumes (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  byte_size INT UNSIGNED NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  file_status ENUM('pending','active','deleted') NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_resumes_object_key UNIQUE (object_key),
  CONSTRAINT ck_resumes_pdf CHECK (content_type = 'application/pdf'),
  CONSTRAINT ck_resumes_size CHECK (byte_size > 0 AND byte_size <= 10485760),
  INDEX ix_resumes_user_status (user_id, file_status, uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidence_sources (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  source_type ENUM('resume','project','skill','external') NOT NULL,
  title VARCHAR(190) NOT NULL,
  excerpt TEXT NOT NULL,
  source_url VARCHAR(512) NULL,
  source_status ENUM('active','deleted') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_evidence_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX ix_evidence_user_status (user_id, source_status, created_at),
  INDEX ix_evidence_type (source_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidence_resume_sources (
  evidence_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  resume_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  CONSTRAINT fk_ers_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_sources(id) ON DELETE CASCADE,
  CONSTRAINT fk_ers_resume FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  INDEX ix_ers_resume (resume_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidence_project_sources (
  evidence_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  project_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  CONSTRAINT fk_eps_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_sources(id) ON DELETE CASCADE,
  CONSTRAINT fk_eps_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX ix_eps_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidence_skill_sources (
  evidence_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  skill_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  CONSTRAINT fk_ess_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_sources(id) ON DELETE CASCADE,
  CONSTRAINT fk_ess_skill FOREIGN KEY (skill_id) REFERENCES student_skills(id) ON DELETE CASCADE,
  INDEX ix_ess_skill (skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evidence_matches (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  evidence_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  requirement_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  review_status ENUM('pending','accepted','partial','rejected') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(1000) NULL,
  reviewed_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_sources(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_requirement FOREIGN KEY (requirement_id) REFERENCES job_requirements(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_matches_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uq_matches_evidence_requirement UNIQUE (evidence_id, requirement_id),
  INDEX ix_matches_requirement_review (requirement_id, review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  job_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  assessment_status ENUM('in_progress','completed') NOT NULL DEFAULT 'completed',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  CONSTRAINT fk_assessments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessments_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
  INDEX ix_assessments_user_date (user_id, started_at),
  INDEX ix_assessments_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_eligibility_results (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  assessment_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  rule_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  actual_value JSON NULL,
  pass_status ENUM('pass','fail','missing') NOT NULL,
  evaluated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aer_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_aer_rule FOREIGN KEY (rule_id) REFERENCES job_eligibility_rules(id) ON DELETE RESTRICT,
  CONSTRAINT uq_assessment_eligibility_rule UNIQUE (assessment_id, rule_id),
  INDEX ix_eligibility_result_assessment (assessment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_results (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  assessment_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  requirement_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  verdict ENUM('MET','PARTIAL','NOT EVIDENCED') NOT NULL,
  rationale VARCHAR(1000) NOT NULL,
  evidence_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_results_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_results_requirement FOREIGN KEY (requirement_id) REFERENCES job_requirements(id) ON DELETE RESTRICT,
  CONSTRAINT uq_results_assessment_requirement UNIQUE (assessment_id, requirement_id),
  INDEX ix_results_requirement_verdict (requirement_id, verdict)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_result_evidence (
  result_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  evidence_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (result_id, evidence_id),
  CONSTRAINT fk_are_result FOREIGN KEY (result_id) REFERENCES assessment_results(id) ON DELETE CASCADE,
  CONSTRAINT fk_are_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_sources(id) ON DELETE RESTRICT,
  INDEX ix_are_evidence (evidence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roadmap_actions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  requirement_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  source_assessment_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  title VARCHAR(220) NOT NULL,
  effort ENUM('small','medium','large') NOT NULL DEFAULT 'medium',
  required_evidence TEXT NULL,
  action_status ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_roadmap_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_roadmap_requirement FOREIGN KEY (requirement_id) REFERENCES job_requirements(id) ON DELETE SET NULL,
  CONSTRAINT fk_roadmap_assessment FOREIGN KEY (source_assessment_id) REFERENCES assessments(id) ON DELETE SET NULL,
  INDEX ix_roadmap_user_status (user_id, action_status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  job_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  application_stage ENUM('saved','applied','screening','interview','offer','rejected','withdrawn') NOT NULL DEFAULT 'saved',
  applied_on DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
  CONSTRAINT uq_applications_user_job UNIQUE (user_id, job_id),
  INDEX ix_applications_user_stage (user_id, application_stage, updated_at),
  INDEX ix_applications_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resources (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  resource_url VARCHAR(512) NOT NULL,
  visibility ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_by CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_resources_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX ix_resources_visibility_category (visibility, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  actor_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX ix_audit_actor_date (actor_user_id, created_at),
  INDEX ix_audit_entity (entity_type, entity_id, created_at),
  INDEX ix_audit_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
