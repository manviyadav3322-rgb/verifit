"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, FileSearch2, ShieldCheck, X } from "lucide-react";
import { Card, PageTitle, Tag } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { dataApi } from "@/lib/client-api";

type Result = { id: string; job: { id: string; title: string; company: string; location: string | null }; startedAt: string; completedAt: string | null; eligibility: Array<{ ruleId: string; label: string; operator: string; expectedValue: unknown; actualValue: unknown; status: "pass" | "fail" | "missing" }>; eligibilitySummary: { passed: number; failed: number; missing: number; total: number }; results: Array<{ requirementId: string; requirementName: string; requirementKind: string; required: boolean; verdict: "MET" | "PARTIAL" | "NOT EVIDENCED"; rationale: string; evidenceCount: number; evidence: Array<{ id: string; title: string; excerpt: string; sourceType: string; sourceUrl: string | null; sourceStatus: string }> }>; summary: { total: number; met: number; partial: number; notEvidenced: number; coverage: number } };

export function AssessmentResultView({ assessmentId }: { assessmentId?: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Result["results"][number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const endpoint = assessmentId ? `assessments?id=${encodeURIComponent(assessmentId)}` : "assessments/latest";
    void dataApi<{ result: Result | null }>(endpoint).then((data) => { if (active) setResult(data.result); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Assessment could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [assessmentId]);

  if (loading) return <><PageTitle title="Assessment result" description="Loading stored assessment data…" /><Card className="section-card"><p className="text-muted">Loading…</p></Card></>;
  if (error) return <><PageTitle title="Assessment result" description="Unable to load this assessment." /><Card className="section-card"><p role="alert" className="text-muted">{error}</p><Link className="button button-outline button-sm" href="/history">View history</Link></Card></>;
  if (!result) return <><PageTitle title="Assessment result" description="No stored assessment was found for this account." /><Card className="data-empty"><ShieldCheck size={22} /><h2>No assessment yet</h2><p>Choose an open job and save an assessment to see actual eligibility rules and evidence matches.</p><Link className="button button-primary button-sm" href="/assessment">Start an assessment</Link></Card></>;

  const eligible = result.eligibilitySummary.failed === 0 && result.eligibilitySummary.missing === 0;
  return <>
    <PageTitle eyebrow={`${result.job.company} · ${new Date(result.startedAt).toLocaleString()}`} title={`${result.job.title} readiness`} description="Your readiness is based on evidence, not a keyword score. Eligibility is reported separately from evidence fit." action={<Link href={`/jobs/${result.job.id}`} className="button button-outline button-md"><ArrowLeft size={13} /> Job details</Link>} />
    <section className="metric-grid" style={{ marginBottom: 20 }} aria-label="Stored assessment summary">
      <Card className="metric-card"><span><ShieldCheck size={14} /> Eligibility</span><strong className={eligible ? "metric-positive" : "metric-neutral"}>{result.eligibilitySummary.total === 0 ? "No rules" : eligible ? "PASS" : "REVIEW"}</strong><small>{result.eligibilitySummary.passed}/{result.eligibilitySummary.total} rules passed · {result.eligibilitySummary.missing} missing</small></Card>
      <Card className="metric-card"><span>Evidence fit</span><strong>{result.summary.met}/{result.summary.total}</strong><small>{result.summary.met} Met · {result.summary.partial} Partial · {result.summary.notEvidenced} Not Evidenced</small></Card>
      <Card className="metric-card"><span><FileSearch2 size={14} /> Evidence coverage</span><strong>{result.summary.coverage}/{result.summary.total}</strong><small>Requirements supported by linked material</small></Card>
      <Card className="metric-card"><span><CheckCircle2 size={14} /> Assessment</span><strong>Saved</strong><small>{result.completedAt ? new Date(result.completedAt).toLocaleDateString() : "Completion time not recorded"}</small></Card>
    </section>

    <Card className="section-card" style={{ marginBottom: 17 }}><div className="card-heading"><div><h2>Eligibility rules</h2><p>Hard requirements are checked independently using your saved profile fields.</p></div><Tag>{result.eligibilitySummary.failed === 0 && result.eligibilitySummary.missing === 0 ? "Eligible" : "Review rules"}</Tag></div>{result.eligibility.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Rule</th><th>Expected</th><th>Your saved value</th><th>Result</th></tr></thead><tbody>{result.eligibility.map((rule) => <tr key={rule.ruleId}><td>{rule.label}</td><td>{Array.isArray(rule.expectedValue) ? rule.expectedValue.join(", ") : String(rule.expectedValue)}</td><td>{String(rule.actualValue ?? "Not provided")}</td><td><span className={`status-badge ${rule.status === "pass" ? "status-met" : rule.status === "fail" ? "status-partial" : "status-missing"}`}>{rule.status.toUpperCase()}</span></td></tr>)}</tbody></table></div> : <p className="data-empty-inline">No eligibility rules have been published for this job. No eligibility claim can be made.</p>}</Card>

    <div className="card-heading" style={{ margin: "0 0 12px" }}><div><h2 style={{ fontSize: 15 }}>Evidence ledger</h2><p>Every verdict below is based on the stored review state for linked evidence.</p></div><Link href="/gaps" className="button button-primary button-sm">Close your gaps <ArrowRight size={13} /></Link></div>
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Requirement</th><th>Type</th><th>Verdict</th><th>Evidence</th><th>Rationale</th><th>Action</th></tr></thead><tbody>{result.results.map((row) => <tr key={row.requirementId}><td><strong>{row.requirementName}</strong>{row.required ? <small className="table-subtext">Required</small> : <small className="table-subtext">Preferred</small>}</td><td>{row.requirementKind}</td><td><StatusBadge verdict={row.verdict} /></td><td>{row.evidenceCount} linked</td><td>{row.rationale}</td><td><button type="button" className="table-action" onClick={() => setSelected(row)}>Review <ArrowRight size={12} /></button></td></tr>)}</tbody></table>{!result.results.length ? <p className="data-empty-inline">This job has no published evidence requirements.</p> : null}</div>
    <p className="text-muted" style={{ fontSize: 11, marginTop: 12 }}>NOT EVIDENCED means no current material supports the requirement. It is not a statement about your ability. There is no ATS score, ranking, or placement-probability estimate.</p>

    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="drawer-overlay" /><Dialog.Content className="drawer-content" aria-describedby="assessment-evidence-description"><div className="drawer-header"><div><p className="eyebrow">Evidence review</p><Dialog.Title style={{ fontSize: 16 }}>{selected?.requirementName}</Dialog.Title><Dialog.Description id="assessment-evidence-description">Stored citations and current review status for this job requirement.</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" aria-label="Close evidence details"><X size={17} /></button></Dialog.Close></div><div className="drawer-body">{selected ? <><div className="detail-list-row"><span>Verdict</span><StatusBadge verdict={selected.verdict} /></div><p className="long-copy">{selected.rationale}</p>{selected.verdict === "NOT EVIDENCED" ? <div className="evidence-empty-note">No supporting evidence was found in your current materials. This does not mean you lack this skill; your current evidence does not demonstrate it.</div> : null}{selected.evidence.map((item) => <Card className="evidence-citation" key={item.id}><div className="card-heading"><div><h3>{item.title}</h3><p>{item.sourceType} source</p></div><Tag>{item.sourceStatus}</Tag></div><blockquote>{item.excerpt}</blockquote>{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="table-action">Open original source <ArrowRight size={12} /></a> : null}</Card>)}<div className="evidence-disclaimer">VeriFit shows the exact user-provided excerpt and stored reviewer decision. It does not claim automated citation verification or resume extraction.</div></> : null}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
