"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Check, ClipboardCheck, ExternalLink, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle, Tag } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { dataApi, jsonBody } from "@/lib/client-api";

type Requirement = { id: string; name: string; requirementKind: string; description: string | null; requiredFlag: boolean; position: number };
type Rule = { id: string; ruleKey: string; label: string; operator: string; expectedValue: unknown };
type Job = { id: string; title: string; company: string; location: string | null; description: string; jobStatus: "draft" | "open" | "closed"; createdAt?: string; rules?: Rule[]; requirements?: Requirement[] };
type Eligibility = { job: Job; results: Array<{ id: string; label: string; operator: string; expectedValue: unknown; actualValue: unknown; status: "pass" | "fail" | "missing" }>; summary: { pass: number; fail: number; missing: number; total: number } };
type JobKind = "jobs" | "jobDetail" | "eligibility" | "assessment" | "adminJobs";

async function mutate<T>(path: string, method: string, payload?: unknown) {
  return dataApi<T>(path, { method, ...(payload === undefined ? {} : { body: jsonBody(payload) }) });
}

function JobCard({ job, onApply, onAssess }: { job: Job; onApply?: (job: Job) => void; onAssess?: (job: Job) => void }) {
  return <Card className="job-card"><div className="job-card-top"><div className="job-company-mark" aria-hidden="true">{job.company.slice(0, 1).toUpperCase()}</div><div className="job-card-copy"><h2><Link href={`/jobs/${job.id}`}>{job.title}</Link></h2><p>{job.company}{job.location ? ` · ${job.location}` : ""}</p></div><Tag>{job.jobStatus}</Tag></div><p className="job-description">{job.description}</p><div className="job-card-footer"><span className="text-muted">{job.requirements?.length ?? 0} requirements · {job.rules?.length ?? 0} eligibility rules</span><div className="job-card-actions"><Link href={`/jobs/${job.id}`} className="button button-outline button-sm">Details <ExternalLink size={12} /></Link>{onApply ? <Button variant="secondary" size="sm" onClick={() => onApply(job)}>Save job</Button> : null}{onAssess ? <Button size="sm" onClick={() => onAssess(job)}>Assess <ArrowRight size={12} /></Button> : null}</div></div></Card>;
}

export function JobsWorkspace({ kind, jobId }: { kind: JobKind; jobId?: string }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", company: "", location: "", description: "", jobStatus: "draft", requirements: "", rules: "" });
  const [requirementForm, setRequirementForm] = useState({ name: "", requirementKind: "skill", description: "" });
  const [ruleForm, setRuleForm] = useState({ ruleKey: "", label: "", operator: "eq", expectedValue: "" });
  const [managedJob, setManagedJob] = useState<Job | null>(null);

  const loadJobs = useCallback(async () => {
    const endpoint = kind === "adminJobs" ? `admin/jobs?status=${encodeURIComponent(statusFilter)}&sort=${encodeURIComponent(sort)}` : `jobs?q=${encodeURIComponent(search)}&sort=${encodeURIComponent(sort)}`;
    const result = await dataApi<{ jobs: Job[] }>(endpoint);
    setJobs(result.jobs);
    if (!selectedId && result.jobs[0]) setSelectedId(result.jobs[0].id);
  }, [kind, search, sort, statusFilter, selectedId]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        if (kind === "jobDetail") {
          if (!jobId) throw new Error("Job ID is missing.");
          const result = await dataApi<{ job: Job }>(`jobs/${encodeURIComponent(jobId)}`);
          if (active) setJob(result.job);
        } else await loadJobs();
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Unable to load jobs."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [kind, jobId, loadJobs]);

  useEffect(() => {
    if (kind !== "eligibility" || !selectedId) { setEligibility(null); return; }
    let active = true;
    void dataApi<Eligibility>(`eligibility?jobId=${encodeURIComponent(selectedId)}`).then((result) => { if (active) setEligibility(result); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Eligibility could not be evaluated."); });
    return () => { active = false; };
  }, [kind, selectedId]);

  useEffect(() => {
    if (kind !== "adminJobs" || !selectedId) { setManagedJob(null); return; }
    let active = true;
    void dataApi<{ job: Job }>(`admin/jobs/${encodeURIComponent(selectedId)}`).then((result) => { if (active) setManagedJob(result.job); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Job could not be loaded."); });
    return () => { active = false; };
  }, [kind, selectedId, jobs]);

  const visibleJobs = useMemo(() => jobs.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()) || item.company.toLowerCase().includes(search.toLowerCase()) || (item.location ?? "").toLowerCase().includes(search.toLowerCase())), [jobs, search]);

  async function saveApplication(item: Job) {
    try { await mutate(`applications`, "POST", { jobId: item.id }); toast.success("Job saved to your applications."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Job could not be saved."); }
  }

  async function startAssessment(item: Job) {
    setBusy(true);
    try { const result = await mutate<{ result: { id: string } }>("assessments", "POST", { jobId: item.id }); toast.success("Assessment saved."); router.push(`/assessment/result?id=${encodeURIComponent(result.result.id)}`); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Assessment could not start."); }
    finally { setBusy(false); }
  }

  async function createJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const requirements = form.requirements.split("\n").map((value) => value.trim()).filter(Boolean).map((name) => ({ name, requirementKind: "skill", requiredFlag: true }));
      let rules: unknown[] = [];
      if (form.rules.trim()) { const decoded = JSON.parse(form.rules); if (!Array.isArray(decoded)) throw new Error("Eligibility rules must be a JSON array."); rules = decoded; }
      const created = await mutate<{ job: Job }>("admin/jobs", "POST", { title: form.title, company: form.company, location: form.location, description: form.description, jobStatus: form.jobStatus, requirements, rules });
      toast.success("Job created."); setForm({ title: "", company: "", location: "", description: "", jobStatus: "draft", requirements: "", rules: "" }); setSelectedId(created.job.id); await loadJobs();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Job could not be created."); }
    finally { setBusy(false); }
  }

  async function addRequirement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!managedJob) return;
    try { await mutate(`admin/jobs/${managedJob.id}/requirements`, "POST", { ...requirementForm, requiredFlag: true, position: managedJob.requirements?.length ?? 0 }); toast.success("Requirement added."); setRequirementForm({ name: "", requirementKind: "skill", description: "" }); const result = await dataApi<{ job: Job }>(`admin/jobs/${managedJob.id}`); setManagedJob(result.job); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Requirement could not be added."); }
  }

  async function addRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!managedJob) return;
    let expectedValue: unknown = ruleForm.expectedValue;
    try { if (/^-?\d+(\.\d+)?$/.test(ruleForm.expectedValue)) expectedValue = Number(ruleForm.expectedValue); else if (/^[\[{]/.test(ruleForm.expectedValue.trim())) expectedValue = JSON.parse(ruleForm.expectedValue); }
    catch { toast.error("Enter a valid number, string, or JSON list."); return; }
    try { await mutate(`admin/jobs/${managedJob.id}/eligibility`, "POST", { ...ruleForm, expectedValue }); toast.success("Eligibility rule added."); setRuleForm({ ruleKey: "", label: "", operator: "eq", expectedValue: "" }); const result = await dataApi<{ job: Job }>(`admin/jobs/${managedJob.id}`); setManagedJob(result.job); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Rule could not be added."); }
  }

  async function closeJob(item: Job) {
    if (!window.confirm(`Close “${item.title}” and remove it from the active job catalog?`)) return;
    try { await mutate(`admin/jobs/${item.id}`, "DELETE"); toast.success("Job closed."); setSelectedId(""); await loadJobs(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Job could not be closed."); }
  }

  if (loading) return <><PageTitle title={kind === "jobs" ? "Jobs" : kind === "jobDetail" ? "Job details" : kind === "eligibility" ? "Eligibility" : kind === "assessment" ? "Assess readiness" : "Job management"} description="Loading persisted role information…" /><Card className="section-card"><p className="text-muted">Loading…</p></Card></>;
  if (error && kind !== "adminJobs") return <><PageTitle title={kind === "jobDetail" ? "Job details" : kind === "eligibility" ? "Eligibility" : kind === "assessment" ? "Assess readiness" : "Jobs"} description="Unable to load this page." /><Card className="section-card"><p role="alert" className="text-muted">{error}</p><Link href="/jobs" className="button button-outline button-sm">Browse available jobs</Link></Card></>;

  if (kind === "jobs") return <>
    <PageTitle eyebrow="Role catalogue" title="Jobs" description="Explore real opportunities and review their published requirements before you apply." />
    <div className="data-toolbar"><label className="data-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, company, location" aria-label="Search jobs" /></label><label className="filter-control">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="title">Title</option><option value="company">Company</option></select></label></div>
    {visibleJobs.length ? <div className="data-card-list">{visibleJobs.map((item) => <JobCard key={item.id} job={item} onApply={saveApplication} onAssess={startAssessment} />)}</div> : <Card className="data-empty"><BriefcaseBusiness size={22} /><h2>No open jobs found</h2><p>Try a different search, or check back when an administrator publishes a role.</p></Card>}
  </>;

  if (kind === "jobDetail") return job ? <>
    <PageTitle eyebrow={`${job.company}${job.location ? ` · ${job.location}` : ""}`} title={job.title} description="Review the job's actual eligibility rules and requirements. No placement probability is calculated." action={<Button disabled={busy} onClick={() => startAssessment(job)}><ClipboardCheck size={14} /> Assess my evidence</Button>} />
    <div className="data-columns"><Card className="section-card"><h2 className="section-heading">Role description</h2><p className="long-copy">{job.description}</p><div className="detail-label" style={{ marginTop: 18 }}>Eligibility rules</div>{job.rules?.length ? <div className="detail-list">{job.rules.map((rule) => <div className="detail-list-row" key={rule.id}><span>{rule.label}</span><Tag>{rule.operator} {Array.isArray(rule.expectedValue) ? rule.expectedValue.join(", ") : String(rule.expectedValue)}</Tag></div>)}</div> : <p className="text-muted">No structured eligibility rules have been published.</p>}</Card>
      <Card className="section-card"><div className="card-heading"><div><h2>Requirements</h2><p>{job.requirements?.length ?? 0} requirements for evidence review</p></div><Tag>Evidence-based</Tag></div>{job.requirements?.length ? <ul className="requirement-list">{job.requirements.map((requirement) => <li key={requirement.id}><span><strong>{requirement.name}</strong><small>{requirement.description || requirement.requirementKind}{requirement.requiredFlag ? " · Required" : " · Preferred"}</small></span><Tag>{requirement.requirementKind}</Tag></li>)}</ul> : <p className="data-empty-inline">No requirements have been published for this job yet.</p>}<div className="job-detail-actions"><Button variant="secondary" onClick={() => saveApplication(job)}>Save to applications</Button><Button disabled={busy} onClick={() => startAssessment(job)}>Assess readiness <ArrowRight size={13} /></Button></div></Card></div>
  </> : null;

  if (kind === "assessment") return <>
    <PageTitle eyebrow="Evidence-based review" title="Assess readiness" description="Choose an open job. VeriFit checks hard eligibility rules separately from evidence linked to each requirement." />
    <div className="data-toolbar"><label className="data-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a job" aria-label="Search jobs to assess" /></label></div>
    {visibleJobs.length ? <div className="data-card-list">{visibleJobs.map((item) => <JobCard key={item.id} job={item} onAssess={startAssessment} />)}</div> : <Card className="data-empty"><ClipboardCheck size={22} /><h2>No assessment-ready jobs</h2><p>An administrator must create and open a job before a real assessment can be saved.</p><Link className="button button-outline button-sm" href="/jobs">Browse jobs</Link></Card>}
  </>;

  if (kind === "eligibility") return <>
    <PageTitle eyebrow="Hard requirements" title="Eligibility" description="Eligibility rules are evaluated separately from skills and evidence. Missing profile data is marked as missing, not silently assumed." />
    <Card className="section-card"><label className="form-field"><span>Select an open job</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Choose a job</option>{jobs.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.company}</option>)}</select></label>
      {!jobs.length ? <p className="data-empty-inline">No active jobs are available to evaluate.</p> : eligibility ? <><div className="eligibility-summary-row"><strong>{eligibility.summary.pass}/{eligibility.summary.total} rules passed</strong><span>{eligibility.summary.fail} failed · {eligibility.summary.missing} missing</span><Link href={`/jobs/${eligibility.job.id}`} className="table-action">View job</Link></div>{eligibility.results.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Eligibility rule</th><th>Expected</th><th>Your profile</th><th>Result</th></tr></thead><tbody>{eligibility.results.map((rule) => <tr key={rule.id}><td>{rule.label}</td><td>{Array.isArray(rule.expectedValue) ? rule.expectedValue.join(", ") : String(rule.expectedValue)}</td><td>{String(rule.actualValue ?? "Not provided")}</td><td><span className={`status-badge ${rule.status === "pass" ? "status-met" : rule.status === "fail" ? "status-partial" : "status-missing"}`}>{rule.status.toUpperCase()}</span></td></tr>)}</tbody></table></div> : <p className="data-empty-inline">This job has no structured eligibility rules. The employer has not supplied rules to evaluate.</p>}<p className="text-muted" style={{ fontSize: 11, marginTop: 14 }}>This is a rule check only; it is not an ATS score or a placement prediction.</p></> : selectedId ? <p className="data-empty-inline">Evaluating stored rules…</p> : null}
    </Card>
  </>;

  return <>
    <PageTitle eyebrow="Administrator workspace" title="Job management" description="Create and maintain real job records, eligibility rules, and evidence requirements. Only Admin accounts can access these controls." />
    <div className="data-columns admin-job-layout"><div style={{ display: "grid", gap: 14 }}>
      <Card className="section-card"><div className="card-heading"><div><h2>Create a job</h2><p>Jobs start as drafts unless explicitly opened.</p></div><Plus size={16} /></div><form className="data-form" onSubmit={createJob}><div className="form-grid"><label className="form-field">Title<input required maxLength={220} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="form-field">Company<input required maxLength={190} value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} /></label><label className="form-field">Location<input maxLength={190} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label><label className="form-field">Status<select value={form.jobStatus} onChange={(event) => setForm({ ...form, jobStatus: event.target.value })}><option value="draft">Draft</option><option value="open">Open</option></select></label></div><label className="form-field">Description<textarea required rows={3} maxLength={15000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="form-field">Requirements <span className="helper-text">One per line; each is saved as a required skill.</span><textarea rows={3} value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} /></label><label className="form-field">Eligibility rules <span className="helper-text">Optional JSON array of rules; each entry needs ruleKey, label, operator, and expectedValue.</span><textarea rows={3} value={form.rules} onChange={(event) => setForm({ ...form, rules: event.target.value })} placeholder='[{"ruleKey":"cgpa","label":"CGPA ≥ 7.0","operator":"min","expectedValue":7}]' /></label><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Create job"}</Button></form></Card>
      <Card className="section-card"><div className="card-heading"><div><h2>Existing jobs</h2><p>Search and change published status.</p></div><label className="filter-control"><span className="sr-only">Job status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="open">Open</option><option value="draft">Draft</option><option value="closed">Closed</option></select></label></div><div className="admin-record-list">{jobs.length ? jobs.map((item) => <button type="button" key={item.id} className={`admin-record ${selectedId === item.id ? "active" : ""}`} onClick={() => setSelectedId(item.id)}><span><strong>{item.title}</strong><small>{item.company} · {item.jobStatus}</small></span><ArrowRight size={14} /></button>) : <p className="data-empty-inline">No jobs with this status.</p>}</div></Card>
    </div>
    <div style={{ display: "grid", alignContent: "start", gap: 14 }}>
      <Card className="section-card"><div className="card-heading"><div><h2>Requirements & eligibility</h2><p>{managedJob?.title ?? "Select a job"}</p></div>{managedJob ? <Tag>{managedJob.jobStatus}</Tag> : null}</div>
        {managedJob ? <><div className="detail-list">{managedJob.requirements?.map((item) => <div className="detail-list-row" key={item.id}><span>{item.name} <small>{item.requirementKind}</small></span><button type="button" className="icon-button danger" aria-label={`Delete ${item.name}`} onClick={async () => { try { await mutate(`admin/jobs/${managedJob.id}/requirements/${item.id}`, "DELETE"); const refreshed = await dataApi<{ job: Job }>(`admin/jobs/${managedJob.id}`); setManagedJob(refreshed.job); toast.success("Requirement deleted."); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Requirement could not be deleted."); } }}><Trash2 size={13} /></button></div>)}{managedJob.rules?.map((item) => <div className="detail-list-row" key={item.id}><span>{item.label} <small>{item.operator} {String(item.expectedValue)}</small></span><button type="button" className="icon-button danger" aria-label={`Delete rule ${item.label}`} onClick={async () => { try { await mutate(`admin/jobs/${managedJob.id}/eligibility/${item.id}`, "DELETE"); const refreshed = await dataApi<{ job: Job }>(`admin/jobs/${managedJob.id}`); setManagedJob(refreshed.job); toast.success("Eligibility rule deleted."); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Rule could not be deleted."); } }}><Trash2 size={13} /></button></div>)}{!managedJob.requirements?.length && !managedJob.rules?.length ? <p className="data-empty-inline">No requirements or rules yet.</p> : null}</div>
          <form className="compact-admin-form" onSubmit={addRequirement}><h3>Add a requirement</h3><input required aria-label="Requirement name" placeholder="e.g. PostgreSQL" value={requirementForm.name} onChange={(event) => setRequirementForm({ ...requirementForm, name: event.target.value })} /><select aria-label="Requirement type" value={requirementForm.requirementKind} onChange={(event) => setRequirementForm({ ...requirementForm, requirementKind: event.target.value })}><option value="skill">Skill</option><option value="experience">Experience</option><option value="certification">Certification</option><option value="project">Project</option></select><Button size="sm" type="submit"><Plus size={12} /> Add</Button></form>
          <form className="compact-admin-form" onSubmit={addRule}><h3>Add eligibility rule</h3><input required aria-label="Rule key" placeholder="rule key, e.g. cgpa" value={ruleForm.ruleKey} onChange={(event) => setRuleForm({ ...ruleForm, ruleKey: event.target.value })} /><input required aria-label="Rule label" placeholder="Rule label" value={ruleForm.label} onChange={(event) => setRuleForm({ ...ruleForm, label: event.target.value })} /><select aria-label="Rule operator" value={ruleForm.operator} onChange={(event) => setRuleForm({ ...ruleForm, operator: event.target.value })}><option value="min">Minimum</option><option value="max">Maximum</option><option value="eq">Equals</option><option value="in">In list</option></select><input required aria-label="Expected value" placeholder="Expected value" value={ruleForm.expectedValue} onChange={(event) => setRuleForm({ ...ruleForm, expectedValue: event.target.value })} /><Button size="sm" type="submit"><Plus size={12} /> Add</Button></form>
          {managedJob.jobStatus === "open" ? <Button variant="outline" size="sm" onClick={() => closeJob(managedJob)}>Close job</Button> : null}
        </> : <p className="data-empty-inline">Select a persisted job to manage its rule and requirement records.</p>}
      </Card>
      {error ? <Card className="section-card"><p role="alert" className="text-muted">{error}</p></Card> : null}
    </div></div>
  </>;
}
