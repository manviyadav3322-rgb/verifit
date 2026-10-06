"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Info, ShieldCheck } from "lucide-react";
import { EvidenceLedger } from "@/components/features/evidence-ledger";
import { AnimatedCount } from "@/components/ui/animated-count";
import { Button, Card, PageTitle } from "@/components/ui/primitives";
import { useProfile } from "@/components/profile-provider";
import { requirements, skillCounts } from "@/data/mock-data";

const dashboardRows = requirements.filter((item) => ["react", "node", "postgresql", "system-design", "docker", "cgpa"].includes(item.id));

export default function DashboardPage() {
  const { profile } = useProfile();
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";
  const branch = profile.branch.toLowerCase();
  const branchPassed = branch.includes("information technology") || branch.includes("computer science") || /\b(it|cs)\b/.test(branch);
  const cgpaPassed = Number.parseFloat(profile.cgpa) >= 7;
  const graduationPassed = profile.graduationYear === "2027";
  const backlogs = Number.parseInt(profile.backlogCount, 10);
  const backlogPassed = Number.isFinite(backlogs) && backlogs === 0;
  const eligibility = [
    { label: "CGPA ≥ 7.0", value: profile.cgpa || "—", passed: cgpaPassed },
    { label: "Branch: IT / CS", value: profile.branch || "—", passed: branchPassed },
    { label: "Graduation year · 2027", value: profile.graduationYear || "—", passed: graduationPassed },
    { label: "Backlogs", value: profile.backlogCount || "—", passed: backlogPassed },
  ];
  const passedCount = eligibility.filter((rule) => rule.passed).length;

  return (
    <>
      <PageTitle eyebrow="Tuesday, October 6" title={`Good evening, ${firstName}`} description="Here's where you stand for your target role." action={<Link href="/assessment" className="button button-primary button-md"><ClipboardCheck size={15} /> Review assessment</Link>} />
      <div className="dashboard-grid">
        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <Card className="section-card eligibility-card">
            <div className="card-heading">
              <div className="eligibility-title"><span className="eligibility-icon"><ShieldCheck size={17} /></span><div><h2>Eligibility</h2><p>Hard rules for {profile.targetRole}</p></div></div>
              <span className="eligibility-count"><CheckCircle2 size={12} style={{ verticalAlign: "middle", marginRight: 4 }} /> {passedCount === 4 ? "Eligible" : "Needs review"} · {passedCount}/4 passed</span>
            </div>
            <div className="eligibility-list">{eligibility.map((rule) => <div className="eligibility-rule" key={rule.label}><span>{rule.label}</span><strong style={{ color: rule.passed ? "var(--green)" : "var(--red)" }}>{rule.passed ? <Check size={13} /> : <span aria-hidden="true">×</span>} {rule.value}</strong></div>)}</div>
          </Card>
          <Card className="section-card readiness-card">
            <div className="card-heading"><div><h2>Readiness overview</h2><p>Evidence coverage across 12 role requirements</p></div><span className="tag">{profile.targetRole}</span></div>
            <div className="mini-bars">
              <div className="mini-bar-row"><span>Met</span><div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${(skillCounts.met / 12) * 100}%`, background: "var(--green)" }} /></div><strong>{skillCounts.met}</strong></div>
              <div className="mini-bar-row"><span>Partial</span><div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${(skillCounts.partial / 12) * 100}%`, background: "var(--amber)" }} /></div><strong>{skillCounts.partial}</strong></div>
              <div className="mini-bar-row"><span>Not evidenced</span><div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${(skillCounts.notEvidenced / 12) * 100}%`, background: "var(--muted)" }} /></div><strong>{skillCounts.notEvidenced}</strong></div>
            </div>
            <div className="legend-row"><span className="legend-item"><i className="legend-dot" style={{ background: "var(--green)" }} /><AnimatedCount value={skillCounts.met} /> Met</span><span className="legend-item"><i className="legend-dot" style={{ background: "var(--amber)" }} /><AnimatedCount value={skillCounts.partial} /> Partial</span><span className="legend-item"><i className="legend-dot" style={{ background: "var(--muted)" }} /><AnimatedCount value={skillCounts.notEvidenced} /> Not Evidenced</span></div>
            <p style={{ margin: "14px 0 0", display: "flex", alignItems: "flex-start", gap: 6, color: "var(--muted)", fontSize: 10 }}><Info size={13} style={{ flex: "0 0 auto", marginTop: 1 }} />Eligibility updates from your profile. Skill verdicts are fixed demo evidence for SDE Intern; no hiring probability is calculated.</p>
          </Card>
          <EvidenceLedger items={dashboardRows} variant="dashboard" />
        </div>

        <aside style={{ display: "grid", alignContent: "start", gap: 15 }}>
          <Card className="action-panel">
            <span className="eyebrow" style={{ color: "var(--accent-strong)" }}>NEXT BEST ACTION</span>
            <h2>Your fastest path to stronger readiness</h2>
            <ol className="action-list"><li><span>1</span><span>Add PostgreSQL project evidence</span></li><li><span>2</span><span>Document REST API implementation</span></li><li><span>3</span><span>Complete System Design milestone</span></li></ol>
            <Link href="/roadmap" className="button button-primary button-md" style={{ width: "100%" }}>Open roadmap <ArrowRight size={14} /></Link>
          </Card>
          <Card className="section-card">
            <div className="card-heading"><div><h3>Profile snapshot</h3><p>Details checked against eligibility</p></div><Link href="/profile" className="table-action">Edit</Link></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
              <div><span className="detail-label">Degree</span><strong style={{ fontSize: 12 }}>{profile.degree} {profile.branch}</strong></div><div><span className="detail-label">Graduation</span><strong style={{ fontSize: 12 }}>{profile.graduationYear}</strong></div><div><span className="detail-label">CGPA</span><strong style={{ fontSize: 12 }}>{profile.cgpa} / 10</strong></div><div><span className="detail-label">Backlogs</span><strong style={{ fontSize: 12 }}>{profile.backlogCount}</strong></div>
            </div>
          </Card>
          <Card className="section-card" style={{ background: "var(--surface-soft)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><span className="eligibility-icon" style={{ width: 28, height: 28, background: "var(--surface)" }}><Info size={14} /></span><div><strong style={{ fontSize: 11 }}>How to read this</strong><p style={{ margin: "5px 0 0", color: "var(--muted)", fontSize: 10, lineHeight: 1.65 }}>NOT EVIDENCED describes your current materials—not what you know. Open a row to review its source or see what evidence is missing.</p></div></div>
          </Card>
        </aside>
      </div>
    </>
  );
}
