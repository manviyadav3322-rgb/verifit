"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, Download, FileText, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle, Tag } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { dataApi, jsonBody } from "@/lib/client-api";
import { JobsWorkspace } from "@/components/features/jobs-workspace";

type Gap = { requirementId: string; requirementName: string; requirementKind: string; verdict: "MET" | "PARTIAL" | "NOT EVIDENCED"; rationale: string; evidence: Array<{ title: string; excerpt: string }> };
type GapData = { assessment: { id: string; job: { id: string; title: string; company: string }; startedAt: string } | null; gaps: Gap[] };
type RoadmapAction = { id: string; title: string; effort: string; requiredEvidence: string | null; actionStatus: "not_started" | "in_progress" | "completed"; requirementId: string | null; requirementName: string | null; sourceAssessmentId: string | null; createdAt: string };
type Application = { id: string; jobId: string; title: string; company: string; location: string | null; stage: string; appliedOn: string | null; notes: string | null; updatedAt: string };
type Resource = { id: string; title: string; category: string; description: string; resourceUrl: string; visibility: "draft" | "published" | "archived" };
type AdminUser = { id: string; email: string | null; displayName: string; role: "student" | "admin"; accountStatus: "active" | "disabled"; createdAt: string };
type ReviewEvidence = { matchId: string; evidenceId: string; ownerId: string; title: string; excerpt: string; sourceType: string; sourceUrl: string | null; reviewStatus: string; reviewNote: string | null; requirementId: string; requirement: string; jobId: string; jobTitle: string };
type AuditEvent = { id: string; actorUserId: string | null; action: string; entityType: string; entityId: string | null; details: Record<string, unknown> | null; createdAt: string };
type Report = { assessments: Array<{ id: string; jobTitle: string; company: string; startedAt: string; met: number; partial: number; notEvidenced: number; requirementCount: number }>; applicationStages: Array<{ stage: string; count: number }>; totalAssessments: number; totalResults: number; totalApplications: number };
type WorkflowKind = "gaps" | "roadmap" | "applications" | "history" | "reports" | "resources" | "admin" | "audit";

async function mutate<T>(path: string, method: string, value?: unknown) { return dataApi<T>(path, { method, ...(value === undefined ? {} : { body: jsonBody(value) }) }); }
function nice(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (part) => part.toUpperCase()); }

function AdminConsole({ initialTab = "users" }: { initialTab?: string }) {
  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [review, setReview] = useState<ReviewEvidence[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({ title: "", category: "", description: "", resourceUrl: "", visibility: "draft" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (tab === "users") { const result = await dataApi<{ users: AdminUser[] }>("admin/users"); setUsers(result.users); }
      if (tab === "evidence") { const result = await dataApi<{ evidence: ReviewEvidence[] }>("admin/evidence"); setReview(result.evidence); }
      if (tab === "audit") { const result = await dataApi<{ events: AuditEvent[] }>("admin/audit?limit=200"); setEvents(result.events); }
      if (tab === "resources") { const result = await dataApi<{ resources: Resource[] }>("admin/resources"); setResources(result.resources); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The administrator data could not be loaded."); }
    finally { setLoading(false); }
  }, [tab]);
  useEffect(() => { if (tab !== "jobs") void load(); }, [load, tab]);

  async function updateUser(row: AdminUser, patch: { role?: "student" | "admin"; accountStatus?: "active" | "disabled" }) {
    try { await mutate(`admin/users/${row.id}`, "PATCH", patch); toast.success("User access updated."); await load(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "User access could not be changed."); }
  }

  async function reviewEvidence(row: ReviewEvidence, reviewStatus: "accepted" | "partial" | "rejected") {
    try { await mutate(`admin/evidence/${row.matchId}`, "PATCH", { reviewStatus }); toast.success(`Evidence marked ${reviewStatus}.`); await load(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Evidence review failed."); }
  }

  async function createResource(event: FormEvent) {
    event.preventDefault();
    try { await mutate("admin/resources", "POST", form); toast.success("Resource created."); setForm({ title: "", category: "", description: "", resourceUrl: "", visibility: "draft" }); await load(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Resource could not be created."); }
  }

  async function updateResource(row: Resource, visibility: Resource["visibility"]) {
    try { await mutate(`admin/resources/${row.id}`, "PATCH", { visibility }); toast.success("Resource visibility updated."); await load(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Resource could not be updated."); }
  }

  async function archiveResource(row: Resource) {
    if (!window.confirm(`Archive “${row.title}”?`)) return;
    try { await mutate(`admin/resources/${row.id}`, "DELETE"); toast.success("Resource archived."); await load(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Resource could not be archived."); }
  }

  const filteredUsers = users.filter((row) => `${row.displayName} ${row.email ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const filteredReview = review.filter((row) => `${row.title} ${row.requirement} ${row.jobTitle}`.toLowerCase().includes(query.toLowerCase()));

  return <>
    <PageTitle eyebrow={initialTab === "audit" ? "System audit" : "Administrative workspace"} title={initialTab === "audit" ? "Audit history" : "Admin management"} description={initialTab === "audit" ? "Review real events from authenticated application actions; this route does not show sample evaluation metrics." : "Manage verified accounts, jobs, evidence decisions, published resources, and real audit events."} />
    <div className="admin-tabs" role="tablist" aria-label="Administration areas">{[{ id: "users", label: "Users", icon: Users }, { id: "jobs", label: "Jobs", icon: ShieldCheck }, { id: "evidence", label: "Evidence review", icon: FileText }, { id: "resources", label: "Resources", icon: BookOpen }, { id: "audit", label: "Audit", icon: Activity }].map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setQuery(""); }}><Icon size={14} /> {label}</button>)}</div>
    {tab === "jobs" ? <JobsWorkspace kind="adminJobs" /> : <>
      {tab === "users" || tab === "evidence" ? <div className="data-toolbar"><label className="data-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "users" ? "Search name or email" : "Search evidence or requirement"} aria-label="Search admin records" /></label><Button size="sm" variant="outline" onClick={() => void load()}>Refresh</Button></div> : null}
      {error ? <Card className="section-card"><p role="alert" className="text-muted">{error}</p><Button size="sm" variant="outline" onClick={() => void load()}>Retry</Button></Card> : null}
      {loading ? <Card className="section-card"><p className="text-muted">Loading current records…</p></Card> : null}
      {tab === "users" && !loading ? <Card className="section-card"><div className="card-heading"><div><h2>Accounts and roles</h2><p>Only verified Manus identities are stored. New users are Students by default.</p></div><Tag>{users.length} accounts</Tag></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Account status</th><th>Created</th></tr></thead><tbody>{filteredUsers.map((row) => <tr key={row.id}><td><strong>{row.displayName}</strong><small className="table-subtext">{row.email || "Email not provided"}</small></td><td><select aria-label={`${row.displayName} role`} value={row.role} onChange={(event) => void updateUser(row, { role: event.target.value as AdminUser["role"] })}><option value="student">Student</option><option value="admin">Admin</option></select></td><td><select aria-label={`${row.displayName} account status`} value={row.accountStatus} onChange={(event) => void updateUser(row, { accountStatus: event.target.value as AdminUser["accountStatus"] })}><option value="active">Active</option><option value="disabled">Disabled</option></select></td><td>{new Date(row.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>{!filteredUsers.length ? <p className="data-empty-inline">No matching accounts.</p> : null}</div></Card> : null}
      {tab === "evidence" && !loading ? <Card className="section-card"><div className="card-heading"><div><h2>Evidence review queue</h2><p>Accept only evidence that actually supports the linked requirement.</p></div><Tag>{review.length} pending/reviewable links</Tag></div>{filteredReview.length ? <div className="admin-review-list">{filteredReview.map((row) => <article className="admin-review-card" key={row.matchId}><div className="card-heading"><div><h3>{row.title}</h3><p>{row.jobTitle} · {row.requirement} · Student {row.ownerId.slice(0, 8)}</p></div><span className={`status-badge ${row.reviewStatus === "accepted" ? "status-met" : "status-partial"}`}>{row.reviewStatus.toUpperCase()}</span></div><blockquote className="evidence-excerpt">“{row.excerpt}”</blockquote>{row.sourceUrl ? <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="table-action">Open source <ArrowRight size={12} /></a> : null}<div className="job-card-actions"><Button size="sm" onClick={() => void reviewEvidence(row, "accepted")}>Accept evidence</Button><Button size="sm" variant="outline" onClick={() => void reviewEvidence(row, "partial")}>Mark partial</Button><Button size="sm" variant="ghost" onClick={() => void reviewEvidence(row, "rejected")}>Reject</Button></div></article>)}</div> : <div className="data-empty-inline">No evidence links are waiting for review.</div>}</Card> : null}
      {tab === "resources" ? <div className="data-columns"><Card className="section-card"><h2 className="section-heading">Create a resource</h2><form className="data-form" onSubmit={createResource}><label className="form-field">Title<input required maxLength={220} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="form-field">Category<input required maxLength={100} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label className="form-field">Description<textarea required rows={3} maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="form-field">Resource URL<input required type="url" value={form.resourceUrl} onChange={(event) => setForm({ ...form, resourceUrl: event.target.value })} /></label><label className="form-field">Visibility<select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value })}><option value="draft">Draft</option><option value="published">Published</option></select></label><Button type="submit">Create resource</Button></form></Card><div className="data-card-list">{resources.map((row) => <Card className="section-card" key={row.id}><div className="card-heading"><div><h3>{row.title}</h3><p>{row.category}</p></div><Tag>{row.visibility}</Tag></div><p className="long-copy">{row.description}</p><div className="job-card-actions"><a className="table-action" href={row.resourceUrl} target="_blank" rel="noreferrer">Open resource <ArrowRight size={12} /></a><select aria-label={`${row.title} visibility`} value={row.visibility} onChange={(event) => void updateResource(row, event.target.value as Resource["visibility"])}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><Button size="sm" variant="ghost" onClick={() => void archiveResource(row)}><Trash2 size={12} /> Archive</Button></div></Card>)}{!resources.length ? <Card className="data-empty"><h2>No resources</h2><p>Create a resource record to publish it to students.</p></Card> : null}</div></div> : null}
      {tab === "audit" && !loading ? <Card className="section-card"><div className="card-heading"><div><h2>System audit log</h2><p>Real events from authenticated application actions; no sample evaluation metrics.</p></div><Tag>{events.length} events</Tag></div>{events.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Event</th><th>Entity</th><th>Actor</th><th>When</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{event.action}</td><td>{event.entityType}{event.entityId ? ` · ${event.entityId.slice(0, 8)}` : ""}</td><td>{event.actorUserId?.slice(0, 8) ?? "system"}</td><td>{new Date(event.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="data-empty-inline">Audit events appear as real users and administrators use the application.</div>}</Card> : null}
    </>}
  </>;
}

export function WorkflowWorkspace({ kind }: { kind: WorkflowKind }) {
  const [gaps, setGaps] = useState<GapData>({ assessment: null, gaps: [] });
  const [actions, setActions] = useState<RoadmapAction[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [history, setHistory] = useState<{ assessments: Array<{ id: string; jobTitle: string; company: string; startedAt: string }>; events: Array<{ id: string; action: string; entityType: string; entityId: string | null; createdAt: string }> }>({ assessments: [], events: [] });
  const [report, setReport] = useState<Report | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sort, setSort] = useState("updated");
  const [actionForm, setActionForm] = useState({ title: "", effort: "medium", requiredEvidence: "" });

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (kind === "gaps") setGaps(await dataApi<GapData>("gaps"));
      if (kind === "roadmap") { const result = await dataApi<{ actions: RoadmapAction[] }>("roadmap"); setActions(result.actions); }
      if (kind === "applications") { const result = await dataApi<{ applications: Application[] }>("applications"); setApplications(result.applications); }
      if (kind === "history") setHistory(await dataApi<typeof history>("history"));
      if (kind === "reports") setReport(await dataApi<Report>("reports"));
      if (kind === "resources") { const result = await dataApi<{ resources: Resource[] }>("resources"); setResources(result.resources); }
      if (kind === "admin") return;
      if (kind === "audit") return;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Records could not be loaded."); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { if (kind !== "admin" && kind !== "audit") void reload(); }, [kind, reload]);

  async function addRoadmapAction(event: FormEvent) {
    event.preventDefault();
    try { await mutate("roadmap", "POST", { ...actionForm, ...(gaps.assessment ? { sourceAssessmentId: gaps.assessment.id } : {}) }); setActionForm({ title: "", effort: "medium", requiredEvidence: "" }); toast.success("Roadmap action saved."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Roadmap action could not be saved."); }
  }
  async function makeActionForGap(gap: Gap) {
    if (!gaps.assessment) return;
    try { await mutate("roadmap", "POST", { title: `Gather evidence for ${gap.requirementName}`, effort: "medium", requiredEvidence: `Add user-provided material that demonstrates ${gap.requirementName}; request administrator review.`, requirementId: gap.requirementId, sourceAssessmentId: gaps.assessment.id }); toast.success("Action added to your roadmap."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Roadmap action could not be saved."); }
  }
  async function updateAction(row: RoadmapAction, actionStatus: RoadmapAction["actionStatus"]) {
    try { await mutate(`roadmap/${row.id}`, "PATCH", { actionStatus }); toast.success("Roadmap progress saved."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Progress could not be saved."); }
  }
  async function deleteAction(row: RoadmapAction) {
    if (!window.confirm(`Delete “${row.title}” from your roadmap?`)) return;
    try { await mutate(`roadmap/${row.id}`, "DELETE"); toast.success("Roadmap action deleted."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Action could not be deleted."); }
  }
  async function updateApplication(row: Application, patch: { applicationStage?: string; notes?: string | null; appliedOn?: string | null }) {
    try { await mutate(`applications/${row.id}`, "PATCH", patch); toast.success("Application updated."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Application could not be updated."); }
  }
  async function deleteApplication(row: Application) {
    if (!window.confirm(`Remove your application record for “${row.title}”?`)) return;
    try { await mutate(`applications/${row.id}`, "DELETE"); toast.success("Application record deleted."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Application could not be deleted."); }
  }

  const filteredApplications = useMemo(() => applications.filter((row) => (stageFilter === "all" || row.stage === stageFilter) && `${row.title} ${row.company}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "stage" ? a.stage.localeCompare(b.stage) : b.updatedAt.localeCompare(a.updatedAt)), [applications, stageFilter, query, sort]);
  const filteredResources = resources.filter((row) => `${row.title} ${row.category} ${row.description}`.toLowerCase().includes(query.toLowerCase()));
const title = kind === "gaps" ? "Evidence gaps" : kind === "roadmap" ? "Improvement roadmap" : kind === "applications" ? "Application tracking" : kind === "history" ? "History" : kind === "reports" ? "Reports" : kind === "resources" ? "Resources" : kind === "audit" ? "Audit history" : "Admin management";

if (kind === "admin" || kind === "audit") return <AdminConsole initialTab={kind === "audit" ? "audit" : "users"} />;
if (loading) return <><PageTitle title={title} description="Loading persisted records…" /><Card className="section-card"><p className="text-muted">Loading…</p></Card></>;
if (error) return <><PageTitle title={title} description="Unable to load records." /><Card className="section-card"><p role="alert" className="text-muted">{error}</p><Button size="sm" variant="outline" onClick={() => void reload()}>Retry</Button></Card></>;

  if (kind === "gaps") return <>
    <PageTitle eyebrow={gaps.assessment ? `${gaps.assessment.job.title} · ${gaps.assessment.job.company}` : "Evidence review"} title="Evidence gaps" description="Gaps come from your latest stored assessment. NOT EVIDENCED describes current materials—not your underlying ability." action={<Link href="/evidence" className="button button-outline button-md">Add evidence</Link>} />
    {gaps.assessment ? <><Card className="section-card"><div className="card-heading"><div><h2>Latest assessment</h2><p>{new Date(gaps.assessment.startedAt).toLocaleString()}</p></div><Link href={`/assessment/result?id=${gaps.assessment.id}`} className="table-action">Open result <ArrowRight size={12} /></Link></div></Card>{gaps.gaps.length ? <div className="data-card-list">{gaps.gaps.map((gap) => <Card className="section-card" key={gap.requirementId}><div className="card-heading"><div><h2>{gap.requirementName}</h2><p>{gap.requirementKind} · {gap.rationale}</p></div><StatusBadge verdict={gap.verdict} /></div>{gap.evidence.length ? <div className="evidence-excerpt">{gap.evidence.map((item) => <p key={item.title}><strong>{item.title}</strong><br />{item.excerpt}</p>)}</div> : <p className="data-empty-inline">No supporting evidence was found in your current materials. This does not mean you lack the skill; your current evidence does not demonstrate it.</p>}<div className="job-card-actions"><Link href="/evidence" className="button button-outline button-sm">Add supporting evidence</Link><Button size="sm" onClick={() => void makeActionForGap(gap)}><Plus size={12} /> Add roadmap action</Button></div></Card>)}</div> : <Card className="data-empty"><ShieldCheck size={22} /><h2>No evidence gaps in this assessment</h2><p>All required items in the latest assessment were supported by accepted evidence.</p></Card>}</> : <Card className="data-empty"><FileText size={22} /><h2>No assessment history</h2><p>Choose an open job and save a real assessment to see its evidence gaps here.</p><Link href="/assessment" className="button button-primary button-sm">Start an assessment</Link></Card>}
  </>;

  if (kind === "roadmap") return <>
    <PageTitle eyebrow="Personal action plan" title="Close your gaps" description="The smallest set of verifiable actions that can improve your evidence. Completing an action does not automatically change a verdict; supporting evidence must be reviewed." />
    <Card className="section-card"><div className="card-heading"><div><h2>Add a roadmap action</h2><p>Actions are personal and persist in your account.</p></div><Plus size={15} /></div><form className="inline-create-form" onSubmit={(event) => void addRoadmapAction(event)}><input required maxLength={220} aria-label="Roadmap action" placeholder="Action to complete" value={actionForm.title} onChange={(event) => setActionForm({ ...actionForm, title: event.target.value })} /><select aria-label="Effort estimate" value={actionForm.effort} onChange={(event) => setActionForm({ ...actionForm, effort: event.target.value })}><option value="small">Small effort</option><option value="medium">Medium effort</option><option value="large">Large effort</option></select><input maxLength={2000} aria-label="Evidence to provide" placeholder="Evidence to provide" value={actionForm.requiredEvidence} onChange={(event) => setActionForm({ ...actionForm, requiredEvidence: event.target.value })} /><Button type="submit"><Plus size={12} /> Add action</Button></form></Card>
    {actions.length ? <div className="data-card-list roadmap-list">{actions.map((row, index) => <Card className="roadmap-card" key={row.id}><div className="roadmap-number">{String(index + 1).padStart(2, "0")}</div><div className="roadmap-body"><div className="card-heading"><div><h2>{row.title}</h2><p>{row.requirementName ?? "Personal action"} · {nice(row.effort)} effort</p></div><select aria-label={`Status for ${row.title}`} value={row.actionStatus} onChange={(event) => void updateAction(row, event.target.value as RoadmapAction["actionStatus"])}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div>{row.requiredEvidence ? <p className="long-copy"><strong>Evidence to provide:</strong> {row.requiredEvidence}</p> : null}<div className="state-transition"><span>{row.actionStatus === "completed" ? "Action completed" : "Current state"}</span><ArrowRight size={13} /><span>Provide and link evidence</span><ArrowRight size={13} /><span>Admin review determines the evidence verdict</span></div></div><button className="icon-button danger" type="button" aria-label={`Delete ${row.title}`} onClick={() => void deleteAction(row)}><Trash2 size={14} /></button></Card>)}</div> : <Card className="data-empty"><h2>Your roadmap is empty</h2><p>Save actions from your evidence gaps, or add a personal action above.</p><Link href="/gaps" className="button button-outline button-sm">Review evidence gaps</Link></Card>}
  </>;

  if (kind === "applications") return <>
    <PageTitle eyebrow="Job search workflow" title="Application tracking" description="Track jobs you have saved or applied for. Stage changes persist to your account." action={<Link className="button button-primary button-md" href="/jobs">Find jobs <ArrowRight size={14} /></Link>} />
    <div className="data-toolbar"><label className="data-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search job or company" aria-label="Search applications" /></label><label className="filter-control">Stage <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">All stages</option>{["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"].map((stage) => <option key={stage} value={stage}>{nice(stage)}</option>)}</select></label><label className="filter-control">Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="updated">Recently updated</option><option value="title">Job title</option><option value="stage">Stage</option></select></label></div>
    {filteredApplications.length ? <div className="data-card-list">{filteredApplications.map((row) => <Card className="section-card application-card" key={row.id}><div className="card-heading"><div><h2><Link href={`/jobs/${row.jobId}`}>{row.title}</Link></h2><p>{row.company}{row.location ? ` · ${row.location}` : ""}</p></div><Tag>{nice(row.stage)}</Tag></div><div className="application-controls"><label className="filter-control">Stage <select value={row.stage} onChange={(event) => void updateApplication(row, { applicationStage: event.target.value })}>{["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"].map((stage) => <option key={stage} value={stage}>{nice(stage)}</option>)}</select></label><label className="filter-control">Applied on <input type="date" value={row.appliedOn ?? ""} onChange={(event) => void updateApplication(row, { appliedOn: event.target.value || null })} /></label><label className="application-notes">Notes <input defaultValue={row.notes ?? ""} maxLength={5000} onBlur={(event) => { if (event.target.value !== (row.notes ?? "")) void updateApplication(row, { notes: event.target.value || null }); }} /></label><Button size="sm" variant="ghost" onClick={() => void deleteApplication(row)}><Trash2 size={12} /> Remove</Button></div></Card>)}</div> : <Card className="data-empty"><h2>No application records</h2><p>Save an open job to start tracking it here. Your records stay private to your account.</p><Link href="/jobs" className="button button-primary button-sm">Browse jobs</Link></Card>}
  </>;

  if (kind === "history") return <>
    <PageTitle eyebrow="Personal activity" title="History" description="Your completed assessment runs and account actions, loaded from persisted records." />
    <div className="data-columns"><Card className="section-card"><h2 className="section-heading">Assessments</h2>{history.assessments.length ? <div className="event-list">{history.assessments.map((row) => <Link href={`/assessment/result?id=${row.id}`} className="event-row" key={row.id}><span className="event-icon"><ShieldCheck size={14} /></span><span><strong>{row.jobTitle}</strong><small>{row.company} · {new Date(row.startedAt).toLocaleString()}</small></span><ArrowRight size={13} /></Link>)}</div> : <p className="data-empty-inline">No assessments have been completed yet.</p>}</Card><Card className="section-card"><h2 className="section-heading">Recent account events</h2>{history.events.length ? <div className="event-list">{history.events.map((event) => <div className="event-row" key={event.id}><span className="event-icon"><Activity size={14} /></span><span><strong>{nice(event.action)}</strong><small>{event.entityType}{event.entityId ? ` · ${event.entityId.slice(0, 8)}` : ""}</small></span><time>{new Date(event.createdAt).toLocaleDateString()}</time></div>)}</div> : <p className="data-empty-inline">New real account actions will appear here.</p>}</Card></div>
  </>;

  if (kind === "reports") return <>
    <PageTitle eyebrow="Personal data" title="Reports" description="Generated from your actual saved assessments and applications. No sample metrics or placement probability are included." action={<div className="job-card-actions"><Button variant="outline" onClick={() => window.print()}><FileText size={13} /> Print / Save PDF</Button><a className="button button-primary button-md" href="/api/data/export"><Download size={13} /> Download CSV</a></div>} />
    {report ? <><section className="metric-grid report-metrics"><Card className="metric-card"><span>Assessments</span><strong>{report.totalAssessments}</strong><small>Saved assessment records</small></Card><Card className="metric-card"><span>Requirements reviewed</span><strong>{report.totalResults}</strong><small>Actual assessment result rows</small></Card><Card className="metric-card"><span>Applications</span><strong>{report.totalApplications}</strong><small>Tracked job applications</small></Card></section><div className="data-columns"><Card className="section-card"><h2 className="section-heading">Assessment history</h2>{report.assessments.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Job</th><th>Date</th><th>Met</th><th>Partial</th><th>Not evidenced</th><th></th></tr></thead><tbody>{report.assessments.map((row) => <tr key={row.id}><td><strong>{row.jobTitle}</strong><small className="table-subtext">{row.company}</small></td><td>{new Date(row.startedAt).toLocaleDateString()}</td><td>{row.met}</td><td>{row.partial}</td><td>{row.notEvidenced}</td><td><Link href={`/assessment/result?id=${row.id}`} className="table-action">View</Link></td></tr>)}</tbody></table></div> : <p className="data-empty-inline">Run an assessment to include actual results in this report.</p>}</Card><Card className="section-card"><h2 className="section-heading">Application stages</h2>{report.applicationStages.length ? <div className="report-stage-list">{report.applicationStages.map((row) => <div className="detail-list-row" key={row.stage}><span>{nice(row.stage)}</span><strong>{row.count}</strong></div>)}</div> : <p className="data-empty-inline">No application stages to report yet.</p>}<p className="text-muted" style={{ fontSize: 11, marginTop: 15 }}>Report values are calculated from your account’s stored records. They do not indicate hiring odds.</p></Card></div></> : null}
  </>;

  return <>
    <PageTitle eyebrow="Learning library" title="Resources" description="Administrator-published materials for improving evidence and preparing for job requirements." />
    <div className="data-toolbar"><label className="data-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" aria-label="Search resources" /></label></div>
    {filteredResources.length ? <div className="resource-grid">{filteredResources.map((row) => <Card className="section-card" key={row.id}><Tag>{row.category}</Tag><h2 className="resource-title">{row.title}</h2><p className="long-copy">{row.description}</p><a className="button button-outline button-sm" href={row.resourceUrl} target="_blank" rel="noreferrer">Open resource <ArrowRight size={12} /></a></Card>)}</div> : <Card className="data-empty"><BookOpen size={22} /><h2>No published resources</h2><p>Published materials will appear here when an administrator adds them.</p></Card>}
  </>;
}
