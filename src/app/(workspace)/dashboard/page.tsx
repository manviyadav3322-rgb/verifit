import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileSearch2, Info, ShieldCheck } from "lucide-react";
import { Card, PageTitle } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCurrentUser } from "@/lib/auth/server";
import { getDashboard } from "@/lib/data/dashboard";

function formatDate(value: Date | null | undefined) {
  if (!value) return "No assessment yet";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const dashboard = await getDashboard(user.id);
  const { profile, latestAssessment, stats } = dashboard;
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";
  const resultRows = latestAssessment?.results ?? [];
  const gaps = resultRows.filter((row) => row.verdict !== "MET");

  return <>
    <PageTitle eyebrow={formatDate(new Date())} title={`Good evening, ${firstName}`} description="Here's where you stand for your target role." action={<Link href="/jobs" className="button button-primary button-md"><ClipboardCheck size={15} /> Browse jobs</Link>} />
    <div className="dashboard-grid">
      <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
        <div className="data-stat-grid">
          <Card className="data-stat"><span>Open jobs</span><strong>{stats.openJobs}</strong><Link href="/jobs">Browse roles <ArrowRight size={12} /></Link></Card>
          <Card className="data-stat"><span>Applications</span><strong>{stats.applicationCount}</strong><Link href="/applications">Track applications <ArrowRight size={12} /></Link></Card>
          <Card className="data-stat"><span>Assessments</span><strong>{stats.totalAssessments}</strong><Link href="/history">View history <ArrowRight size={12} /></Link></Card>
        </div>
        <Card className="section-card eligibility-card">
          <div className="card-heading"><div className="eligibility-title"><span className="eligibility-icon"><ShieldCheck size={17} /></span><div><h2>Eligibility</h2><p>{latestAssessment ? `Hard rules for ${latestAssessment.job.title}` : "Hard job rules are checked separately from evidence fit."}</p></div></div>
            {latestAssessment ? <span className="eligibility-count">{latestAssessment.eligibilitySummary.passed}/{latestAssessment.eligibilitySummary.total} passed</span> : <Link href="/eligibility" className="table-action">Check a job</Link>}
          </div>
          {latestAssessment?.eligibility.length ? <div className="eligibility-list">{latestAssessment.eligibility.map((rule) => <div className="eligibility-rule" key={rule.ruleId}><span>{rule.label}</span><strong style={{ color: rule.status === "pass" ? "var(--green)" : rule.status === "fail" ? "var(--red)" : "var(--muted)" }}>{rule.status === "pass" ? "PASS" : rule.status === "fail" ? "FAIL" : "MISSING"} · {String(rule.actualValue ?? "Not provided")}</strong></div>)}</div> : <p className="data-empty-inline">No eligibility results are stored yet. Select an open job to evaluate its published criteria against your profile.</p>}
        </Card>
        <Card className="section-card readiness-card">
          <div className="card-heading"><div><h2>Evidence readiness</h2><p>{latestAssessment ? `${latestAssessment.job.title} · ${formatDate(latestAssessment.startedAt)}` : "Evidence fit is calculated only from linked evidence and reviews."}</p></div>{latestAssessment ? <Link href={`/assessment/result?id=${latestAssessment.id}`} className="table-action">Open assessment</Link> : <Link href="/assessment" className="table-action">Start assessment</Link>}</div>
          {latestAssessment ? <>
            <div className="data-stat-grid compact-stats">
              <div className="data-stat"><span>Met</span><strong>{latestAssessment.summary.met}</strong></div>
              <div className="data-stat"><span>Partial</span><strong>{latestAssessment.summary.partial}</strong></div>
              <div className="data-stat"><span>Not evidenced</span><strong>{latestAssessment.summary.notEvidenced}</strong></div>
            </div>
            <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Requirement</th><th>Type</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
              {resultRows.slice(0, 8).map((row) => <tr key={row.requirementId}><td>{row.requirementName}</td><td>{row.requirementKind}</td><td><StatusBadge verdict={row.verdict} /></td><td>{row.evidence.length} source{row.evidence.length === 1 ? "" : "s"}</td></tr>)}
            </tbody></table></div>
          </> : <p className="data-empty-inline">No assessment is saved yet. Add a real job first, then assess your current evidence against its requirements.</p>}
        </Card>
      </div>
      <aside style={{ display: "grid", alignContent: "start", gap: 15 }}>
        <Card className="action-panel"><span className="eyebrow" style={{ color: "var(--accent-strong)" }}>NEXT ACTION</span><h2>{latestAssessment ? "Review your current evidence gaps" : "Start with an open role"}</h2>
          {gaps.length ? <ol className="action-list">{gaps.slice(0, 3).map((gap, index) => <li key={gap.requirementId}><span>{index + 1}</span><span>{gap.requirementName} — {gap.verdict}</span></li>)}</ol> : <p className="data-empty-inline">{latestAssessment ? "The latest assessment has no evidence gaps." : "Job and requirement data will appear here after an administrator adds open roles."}</p>}
          <Link href={latestAssessment ? "/gaps" : "/jobs"} className="button button-primary button-md" style={{ width: "100%" }}>{latestAssessment ? "View evidence gaps" : "Browse jobs"} <ArrowRight size={14} /></Link>
        </Card>
        <Card className="section-card">
          <div className="card-heading"><div><h3>Profile snapshot</h3><p>Values used for job eligibility rules</p></div><Link href="/profile" className="table-action">Edit</Link></div>
          <div className="profile-snapshot-grid"><div><span className="detail-label">Degree / branch</span><strong>{[profile.degree, profile.branch].filter(Boolean).join(" · ") || "Not provided"}</strong></div><div><span className="detail-label">Graduation year</span><strong>{profile.graduationYear || "Not provided"}</strong></div><div><span className="detail-label">CGPA</span><strong>{profile.cgpa ? `${profile.cgpa} / 10` : "Not provided"}</strong></div><div><span className="detail-label">Backlogs</span><strong>{profile.backlogCount}</strong></div></div>
        </Card>
        <Card className="section-card" style={{ background: "var(--surface-soft)" }}><div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span className="eligibility-icon" style={{ width: 28, height: 28, background: "var(--surface)" }}><Info size={14} /></span><div><strong style={{ fontSize: 11 }}>How to read this</strong><p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 10, lineHeight: 1.65 }}>NOT EVIDENCED means your current materials do not demonstrate the requirement. It is not a judgment about what you know.</p><Link href="/evidence" className="table-action" style={{ display: "inline-flex", marginTop: 10 }}><FileSearch2 size={12} /> Open evidence library</Link></div></div></Card>
      </aside>
    </div>
  </>;
}
