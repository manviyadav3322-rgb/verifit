"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, CheckCircle2, FileMinus2, FilePlus2, Info, ShieldCheck } from "lucide-react";
import { Card, PageTitle } from "@/components/ui/primitives";
import { demoMetrics } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";

const chartMetrics = demoMetrics.filter((metric) => metric.label !== "Fairness delta");

function TestFlow({ title, description, leftLabel, leftStatus, rightLabel, rightStatus, icon: Icon }: { title: string; description: string; leftLabel: string; leftStatus: "MET" | "PARTIAL" | "NOT EVIDENCED"; rightLabel: string; rightStatus: "MET" | "PARTIAL" | "NOT EVIDENCED"; icon: typeof FilePlus2 }) {
  return <Card className="section-card"><div className="card-heading"><div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="eligibility-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><Icon size={16} /></span><div><h2>{title}</h2><p>{description}</p></div></div></div><div className="test-flow"><div className="test-step"><span>Input state</span><strong>{leftLabel}</strong><div style={{ marginTop: 9 }}><StatusBadge verdict={leftStatus} /></div></div><ArrowRight size={17} className="test-arrow" aria-hidden="true" /><div className="test-step"><span>Expected result</span><strong>{rightLabel}</strong><div style={{ marginTop: 9 }}><StatusBadge verdict={rightStatus} /></div></div></div></Card>;
}

export default function AuditPage() {
  return <>
    <PageTitle eyebrow="Evaluation observability · Sample data" title="System audit" description="A transparent view of how evidence-based verdicts behave under simple evaluation checks." />
    <div role="note" className="card" style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: 13, marginBottom: 15, borderColor: "var(--accent-line)", background: "var(--accent-soft)", color: "var(--muted-strong)" }}><Info size={15} style={{ flex: "0 0 auto", color: "var(--accent-strong)" }} /><p style={{ margin: 0, fontSize: 11, lineHeight: 1.6 }}><strong style={{ color: "var(--foreground)" }}>Demo evaluation metrics.</strong> These illustrative values are mock data, not real production results or a claim about a live assessment system.</p></div>
    <div className="metric-grid" style={{ marginBottom: 15 }}>{demoMetrics.map((metric) => <Card className="metric-card" key={metric.label}><span>{metric.label}</span><strong>{metric.display}</strong><small>Illustrative demo value</small></Card>)}</div>
    <div className="audit-charts-grid">
      <Card className="section-card"><div className="card-heading"><div><h2>Demo metric comparison</h2><p>Citation precision, recall, and faithfulness · scale 0–100</p></div><span className="tag">Sample</span></div><div className="chart-wrap" role="img" aria-label="Bar chart of demo citation precision, recall and faithfulness values"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartMetrics} layout="vertical" margin={{ top: 5, right: 20, bottom: 3, left: 5 }}><CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="label" width={125} tick={{ fill: "var(--muted-strong)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "var(--surface-soft)" }} formatter={(value) => [`${value}%`, "Demo metric"]} contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 8, fontSize: 11 }} /><Bar dataKey="value" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={15} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="section-card"><div className="card-heading"><div><h2>Fairness delta</h2><p>Illustrative group-level difference</p></div><ShieldCheck size={16} style={{ color: "var(--accent)" }} /></div><div style={{ marginTop: 24, display: "flex", alignItems: "baseline", gap: 7 }}><strong style={{ fontSize: 38, letterSpacing: "-.06em" }}>2.1%</strong><span className="text-muted" style={{ fontSize: 10 }}>demo value</span></div><div style={{ height: 7, background: "var(--surface-soft)", borderRadius: 99, overflow: "hidden", marginTop: 13 }}><div style={{ height: "100%", width: "21%", borderRadius: 99, background: "var(--accent)" }} /></div><p className="text-muted" style={{ fontSize: 10, lineHeight: 1.6, marginTop: 14 }}>This indicator is for interface demonstration only. No fairness evaluation has been run on real users or production data.</p></Card>
    </div>
    <div style={{ display: "grid", gap: 14 }}>
      <TestFlow title="Span deletion test" description="Removing the cited material changes the verdict to reflect the evidence that remains." leftLabel="Evidence present" leftStatus="MET" rightLabel="Evidence removed" rightStatus="NOT EVIDENCED" icon={FileMinus2} />
      <TestFlow title="Counterfactual test" description="Perturbing unrelated profile attributes preserves this requirement's evidence-backed verdict." leftLabel="Original profile" leftStatus="MET" rightLabel="Perturbed profile" rightStatus="MET" icon={FilePlus2} />
    </div>
  </>;
}
