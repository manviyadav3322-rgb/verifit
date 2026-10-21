"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, FileSearch2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle, Tag } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { dataApi, jsonBody } from "@/lib/client-api";

type Skill = { id: string; name: string; proficiency: "beginner" | "intermediate" | "advanced"; createdAt: string };
type Project = { id: string; title: string; description: string; repositoryUrl: string | null; liveUrl: string | null; updatedAt: string };
type Resume = { id: string; fileName: string; fileStatus: string };
type Requirement = { id: string; name: string; requirementKind: string; jobId: string; jobTitle: string; company: string };
type Evidence = { id: string; sourceType: string; title: string; excerpt: string; sourceUrl: string | null; matches: Array<{ id: string; requirementId: string; requirementName: string; reviewStatus: string; reviewNote: string | null }> };
type PortfolioKind = "skills" | "projects" | "evidence";

async function mutate<T>(path: string, method: string, value?: unknown) { return dataApi<T>(path, { method, ...(value === undefined ? {} : { body: jsonBody(value) }) }); }

export function PortfolioWorkspace({ kind }: { kind: PortfolioKind }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(kind === "skills" ? "name" : "newest");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<Skill["proficiency"]>("beginner");
  const [projectForm, setProjectForm] = useState({ title: "", description: "", repositoryUrl: "", liveUrl: "" });
  const [evidenceForm, setEvidenceForm] = useState({ sourceType: "external", sourceRefId: "", requirementId: "", title: "", excerpt: "", sourceUrl: "" });
  const [editingProject, setEditingProject] = useState("");
  const [editingEvidence, setEditingEvidence] = useState("");

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      if (kind === "skills") { const result = await dataApi<{ skills: Skill[] }>(`skills?q=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`); setSkills(result.skills); }
      if (kind === "projects") { const result = await dataApi<{ projects: Project[] }>(`projects?q=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`); setProjects(result.projects); }
      if (kind === "evidence") {
        const [evidenceResult, projectResult, resumeResult, skillResult, requirementResult] = await Promise.all([
          dataApi<{ evidence: Evidence[] }>(`evidence?q=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`),
          dataApi<{ projects: Project[] }>("projects"), dataApi<{ resumes: Resume[] }>("resumes"), dataApi<{ skills: Skill[] }>("skills"),
          dataApi<{ requirements: Requirement[] }>("requirements"),
        ]);
        setEvidence(evidenceResult.evidence); setProjects(projectResult.projects); setResumes(resumeResult.resumes); setSkills(skillResult.skills); setRequirements(requirementResult.requirements);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Data could not be loaded."); }
    finally { setLoading(false); }
  }, [kind, query, sort]);
  useEffect(() => { void reload(); }, [reload]);

  const visibleSkills = useMemo(() => skills.filter((row) => row.name.toLowerCase().includes(query.toLowerCase())), [skills, query]);
  const visibleProjects = useMemo(() => projects.filter((row) => `${row.title} ${row.description}`.toLowerCase().includes(query.toLowerCase())), [projects, query]);
  const visibleEvidence = useMemo(() => evidence.filter((row) => `${row.title} ${row.excerpt} ${row.sourceType}`.toLowerCase().includes(query.toLowerCase())), [evidence, query]);

  async function saveSkill(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { await mutate("skills", "POST", { name: skillName, proficiency: skillLevel }); setSkillName(""); toast.success("Skill saved."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Skill could not be saved."); }
    finally { setBusy(false); }
  }

  async function deleteSkill(row: Skill) {
    if (!window.confirm(`Archive “${row.name}” from your skills?`)) return;
    try { await mutate(`skills/${row.id}`, "DELETE"); toast.success("Skill archived."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Skill could not be archived."); }
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try { await mutate("projects", "POST", projectForm); setProjectForm({ title: "", description: "", repositoryUrl: "", liveUrl: "" }); toast.success("Project saved."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Project could not be saved."); }
    finally { setBusy(false); }
  }

  async function saveEvidence(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    const { sourceType, sourceRefId, requirementId, title, excerpt, sourceUrl } = evidenceForm;
    try {
      await mutate("evidence", "POST", { sourceType, ...(sourceRefId ? { sourceRefId } : {}), ...(requirementId ? { requirementId } : {}), title, excerpt, sourceUrl });
      setEvidenceForm({ sourceType: "external", sourceRefId: "", requirementId: "", title: "", excerpt: "", sourceUrl: "" }); toast.success("Evidence item saved. A linked match is pending review."); await reload();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Evidence could not be saved."); }
    finally { setBusy(false); }
  }

  async function saveProjectEdits(event: FormEvent, row: Project, form: HTMLFormElement) {
    event.preventDefault(); const data = new FormData(form);
    try { await mutate(`projects/${row.id}`, "PATCH", { title: data.get("title"), description: data.get("description"), repositoryUrl: data.get("repositoryUrl"), liveUrl: data.get("liveUrl") }); toast.success("Project updated."); setEditingProject(""); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Project could not be updated."); }
  }

  async function archiveProject(row: Project) {
    if (!window.confirm(`Archive “${row.title}”?`)) return;
    try { await mutate(`projects/${row.id}`, "DELETE"); toast.success("Project archived."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Project could not be archived."); }
  }

  async function saveEvidenceEdits(event: FormEvent, row: Evidence, form: HTMLFormElement) {
    event.preventDefault(); const data = new FormData(form);
    try { await mutate(`evidence/${row.id}`, "PATCH", { title: data.get("title"), excerpt: data.get("excerpt"), sourceUrl: data.get("sourceUrl") }); toast.success("Evidence updated."); setEditingEvidence(""); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Evidence could not be updated."); }
  }

  async function deleteEvidence(row: Evidence) {
    if (!window.confirm(`Remove “${row.title}” from your active evidence library?`)) return;
    try { await mutate(`evidence/${row.id}`, "DELETE"); toast.success("Evidence archived."); await reload(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Evidence could not be removed."); }
  }

  const heading = kind === "skills" ? "Skills" : kind === "projects" ? "Projects" : "Evidence library";
  const description = kind === "skills" ? "Maintain your own skill inventory. A listed skill is not proof that a job requirement is met." : kind === "projects" ? "Manage actual project descriptions and links that can support requirement evidence." : "Add current, user-provided material and explicitly link it to an open job requirement for review.";

  return <>
    <PageTitle eyebrow="Personal portfolio" title={heading} description={description} />
    <div className="data-toolbar"><label className="data-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${heading.toLowerCase()}`} aria-label={`Search ${heading.toLowerCase()}`} /></label>{kind !== "evidence" ? <label className="filter-control">Sort by <select value={sort} onChange={(event) => setSort(event.target.value)}><option value={kind === "skills" ? "name" : "newest"}>{kind === "skills" ? "Name" : "Recently updated"}</option><option value="title">Title</option></select></label> : null}</div>
    {error ? <Card className="section-card"><p role="alert" className="text-muted">{error}</p><Button size="sm" variant="outline" onClick={() => void reload()}>Retry</Button></Card> : null}
    {loading ? <Card className="section-card"><p className="text-muted">Loading persisted {heading.toLowerCase()}…</p></Card> : null}

    {kind === "skills" ? <>
      <Card className="section-card"><div className="card-heading"><div><h2>Add a skill</h2><p>Skills are user-provided profile data; evidence is reviewed separately.</p></div><Plus size={15} /></div><form className="inline-create-form" onSubmit={saveSkill}><input required maxLength={140} aria-label="Skill name" placeholder="e.g. Java" value={skillName} onChange={(event) => setSkillName(event.target.value)} /><select aria-label="Proficiency" value={skillLevel} onChange={(event) => setSkillLevel(event.target.value as Skill["proficiency"])}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add skill"}</Button></form></Card>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Skill</th><th>Proficiency</th><th>Added</th><th>Actions</th></tr></thead><tbody>{visibleSkills.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td><select aria-label={`${row.name} proficiency`} value={row.proficiency} onChange={async (event) => { try { await mutate(`skills/${row.id}`, "PATCH", { proficiency: event.target.value }); toast.success("Proficiency updated."); await reload(); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Update failed."); } }}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></td><td>{new Date(row.createdAt).toLocaleDateString()}</td><td><button className="icon-button danger" type="button" aria-label={`Archive ${row.name}`} onClick={() => void deleteSkill(row)}><Trash2 size={14} /></button></td></tr>)}</tbody></table>{!visibleSkills.length && !loading ? <div className="data-empty-inline">No matching skills. Add a skill above to create your first record.</div> : null}</div>
    </> : null}

    {kind === "projects" ? <>
      <Card className="section-card"><div className="card-heading"><div><h2>Add a project</h2><p>Save real project descriptions and public links.</p></div><Plus size={15} /></div><form className="data-form" onSubmit={saveProject}><label className="form-field">Project name<input required maxLength={190} value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></label><label className="form-field">Description<textarea required rows={3} maxLength={10000} value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} /></label><div className="form-grid"><label className="form-field">Repository URL<input type="url" value={projectForm.repositoryUrl} onChange={(event) => setProjectForm({ ...projectForm, repositoryUrl: event.target.value })} /></label><label className="form-field">Live demo URL<input type="url" value={projectForm.liveUrl} onChange={(event) => setProjectForm({ ...projectForm, liveUrl: event.target.value })} /></label></div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add project"}</Button></form></Card>
      {visibleProjects.length ? <div className="data-card-list">{visibleProjects.map((row) => <Card className="section-card" key={row.id}>{editingProject === row.id ? <form className="data-form" onSubmit={(event) => void saveProjectEdits(event, row, event.currentTarget)}><label className="form-field">Project name<input name="title" required defaultValue={row.title} /></label><label className="form-field">Description<textarea name="description" required rows={3} defaultValue={row.description} /></label><div className="form-grid"><label className="form-field">Repository URL<input name="repositoryUrl" type="url" defaultValue={row.repositoryUrl ?? ""} /></label><label className="form-field">Live demo URL<input name="liveUrl" type="url" defaultValue={row.liveUrl ?? ""} /></label></div><div className="job-card-actions"><Button size="sm" type="submit">Save project</Button><Button size="sm" variant="ghost" type="button" onClick={() => setEditingProject("")}>Cancel</Button></div></form> : <><div className="card-heading"><div><h2>{row.title}</h2><p>Updated {new Date(row.updatedAt).toLocaleDateString()}</p></div><Tag>Project</Tag></div><p className="long-copy">{row.description}</p><div className="job-card-actions">{row.repositoryUrl ? <a className="table-action" href={row.repositoryUrl} target="_blank" rel="noreferrer">Repository <ExternalLink size={12} /></a> : null}{row.liveUrl ? <a className="table-action" href={row.liveUrl} target="_blank" rel="noreferrer">Live demo <ExternalLink size={12} /></a> : null}<Button size="sm" variant="outline" onClick={() => setEditingProject(row.id)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => void archiveProject(row)}><Trash2 size={12} /> Archive</Button></div></>}</Card>)}</div> : !loading ? <Card className="data-empty"><h2>No projects yet</h2><p>Add real project descriptions so they can be linked as evidence.</p></Card> : null}
    </> : null}

    {kind === "evidence" ? <>
      <Card className="section-card"><div className="card-heading"><div><h2>Add evidence</h2><p>VeriFit stores the source excerpt you provide; it does not extract or invent resume text.</p></div><FileSearch2 size={15} /></div><form className="data-form" onSubmit={saveEvidence}><div className="form-grid"><label className="form-field">Source type<select value={evidenceForm.sourceType} onChange={(event) => setEvidenceForm({ ...evidenceForm, sourceType: event.target.value, sourceRefId: "" })}><option value="external">External link or document</option><option value="project">Project</option><option value="skill">Skill</option><option value="resume">Uploaded resume</option></select></label>{evidenceForm.sourceType !== "external" ? <label className="form-field">Source record<select required value={evidenceForm.sourceRefId} onChange={(event) => setEvidenceForm({ ...evidenceForm, sourceRefId: event.target.value })}><option value="">Choose a source</option>{(evidenceForm.sourceType === "project" ? projects.map((row) => ({ id: row.id, name: row.title })) : evidenceForm.sourceType === "skill" ? skills.map((row) => ({ id: row.id, name: row.name })) : resumes.map((row) => ({ id: row.id, name: row.fileName }))).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label> : null}</div><label className="form-field">Evidence title<input required maxLength={190} value={evidenceForm.title} onChange={(event) => setEvidenceForm({ ...evidenceForm, title: event.target.value })} /></label><label className="form-field">Exact excerpt<textarea required rows={4} maxLength={10000} value={evidenceForm.excerpt} onChange={(event) => setEvidenceForm({ ...evidenceForm, excerpt: event.target.value })} /></label><div className="form-grid"><label className="form-field">Source URL<input type="url" value={evidenceForm.sourceUrl} onChange={(event) => setEvidenceForm({ ...evidenceForm, sourceUrl: event.target.value })} /></label><label className="form-field">Link to a job requirement<select value={evidenceForm.requirementId} onChange={(event) => setEvidenceForm({ ...evidenceForm, requirementId: event.target.value })}><option value="">No requirement yet</option>{requirements.map((row) => <option key={row.id} value={row.id}>{row.jobTitle} · {row.name}</option>)}</select></label></div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save evidence"}</Button></form></Card>
      {visibleEvidence.length ? <div className="data-card-list">{visibleEvidence.map((row) => <Card className="section-card" key={row.id}>{editingEvidence === row.id ? <form className="data-form" onSubmit={(event) => void saveEvidenceEdits(event, row, event.currentTarget)}><label className="form-field">Title<input name="title" required defaultValue={row.title} /></label><label className="form-field">Excerpt<textarea name="excerpt" required rows={4} defaultValue={row.excerpt} /></label><label className="form-field">Source URL<input name="sourceUrl" type="url" defaultValue={row.sourceUrl ?? ""} /></label><div className="job-card-actions"><Button size="sm" type="submit">Save</Button><Button size="sm" type="button" variant="ghost" onClick={() => setEditingEvidence("")}>Cancel</Button></div></form> : <><div className="card-heading"><div><h2>{row.title}</h2><p>{row.sourceType} source</p></div><Tag>{row.sourceType}</Tag></div><blockquote className="evidence-excerpt">“{row.excerpt}”</blockquote>{row.sourceUrl ? <a className="table-action" href={row.sourceUrl} target="_blank" rel="noreferrer">Open source <ExternalLink size={12} /></a> : null}{row.matches.length ? <div className="evidence-match-list">{row.matches.map((match) => <div className="detail-list-row" key={match.id}><span>{match.requirementName}{match.reviewNote ? <small>{match.reviewNote}</small> : null}</span><span className={`status-badge ${match.reviewStatus === "accepted" ? "status-met" : match.reviewStatus === "rejected" ? "status-missing" : "status-partial"}`}>{match.reviewStatus.toUpperCase()}</span></div>)}</div> : <p className="text-muted" style={{ fontSize: 11 }}>Not linked to a job requirement yet.</p>}<div className="job-card-actions"><Button size="sm" variant="outline" onClick={() => setEditingEvidence(row.id)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => void deleteEvidence(row)}><Trash2 size={12} /> Remove</Button></div></>}</Card>)}</div> : !loading ? <Card className="data-empty"><FileSearch2 size={22} /><h2>No evidence records yet</h2><p>Add actual excerpts and link them to requirements. A listed skill or resume upload alone does not make a requirement MET.</p></Card> : null}
    </> : null}
  </>;
}
