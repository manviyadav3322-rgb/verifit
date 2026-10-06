import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, FileSearch2, ShieldCheck } from "lucide-react";
import { EvidenceLedger } from "@/components/features/evidence-ledger";
import { Card, PageTitle } from "@/components/ui/primitives";
import { requirements, skillCounts } from "@/data/mock-data";

export default function AssessmentResultPage() {
  return (
    <>
      <PageTitle eyebrow="Assessment result · Demo profile" title="SDE Intern readiness" description="Your readiness is based on evidence, not a keyword score." action={<Link href="/assessment" className="button button-outline button-md"><ArrowLeft size={14} /> Retake assessment</Link>} />
      <section className="metric-grid" style={{ marginBottom: 19 }} aria-label="Readiness summary">
        <Card className="metric-card"><span style={{ display: "flex", alignItems: "center", gap: 7 }}><ShieldCheck size={14} style={{ color: "var(--green)" }} /> Eligibility</span><strong style={{ fontSize: 20, color: "var(--green)" }}>PASS</strong><small>4 of 4 hard rules passed</small></Card>
        <Card className="metric-card"><span>Skills</span><strong>{skillCounts.met} / {requirements.length}</strong><small>{skillCounts.met} Met · {skillCounts.partial} Partial · {skillCounts.notEvidenced} Not Evidenced</small></Card>
        <Card className="metric-card"><span style={{ display: "flex", alignItems: "center", gap: 7 }}><FileSearch2 size={14} style={{ color: "var(--accent)" }} /> Evidence coverage</span><strong>10 / 12</strong><small>Requirements supported by evidence</small></Card>
        <Card className="metric-card"><span style={{ display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={14} style={{ color: "var(--green)" }} /> Assessment</span><strong style={{ fontSize: 20 }}>Complete</strong><small>Evidence ledger is ready to review</small></Card>
      </section>
      <div className="card-heading" style={{ margin: "0 0 12px" }}><div><h2 style={{ fontSize: 15 }}>Evidence Ledger</h2><p>Open any row to inspect the source and cited text.</p></div><Link href="/roadmap" className="button button-primary button-sm">Close your gaps <ArrowRight size={13} /></Link></div>
      <EvidenceLedger items={requirements} variant="full" />
      <p style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 12, color: "var(--muted)", fontSize: 10 }}><ShieldCheck size={14} style={{ flex: "0 0 auto" }} />This demonstration uses local mock evidence. A missing citation is not a statement about your underlying ability.</p>
    </>
  );
}
