"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, FileSearch2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button, Card, PageTitle } from "@/components/ui/primitives";

const steps = [
  { title: "Confirm the target role", prompt: "Which role should this evidence be checked against?", options: ["SDE Intern", "Data Analyst", "ML Engineer — coming soon"], icon: ShieldCheck },
  { title: "Choose evidence sources", prompt: "The demo assessment uses these materials in Manvi’s local profile.", options: ["Resume excerpts", "Project descriptions", "Profile and eligibility details"], icon: FileSearch2 },
  { title: "Review the assessment method", prompt: "How should missing evidence be interpreted?", options: ["As a gap in current materials—not proof I lack the skill", "Show the cited text beside each requirement", "Keep eligibility rules separate from skill fit"], icon: ClipboardCheck },
];

export default function AssessmentPage() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const router = useRouter();
  const current = steps[step];
  const Icon = current.icon;

  function next() {
    if (selected === null) { toast.error("Choose an option to continue."); return; }
    if (step === steps.length - 1) { router.push("/assessment/result"); return; }
    setStep((value) => value + 1);
    setSelected(null);
  }

  return (
    <>
      <PageTitle eyebrow="Evidence review · Demo" title="Check your readiness" description="A transparent review of eligibility and evidence—not a hiring prediction." action={<Link href="/dashboard" className="button button-outline button-sm"><ArrowLeft size={13} /> Dashboard</Link>} />
      <div style={{ maxWidth: 740, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 9, color: "var(--muted)", fontSize: 11 }}><span>Step {step + 1} of {steps.length}</span><span>{Math.round(((step + 1) / steps.length) * 100)}% complete</span></div>
        <div style={{ height: 6, borderRadius: 99, overflow: "hidden", background: "var(--surface-soft)", marginBottom: 18 }}><motion.div initial={false} animate={{ width: `${((step + 1) / steps.length) * 100}%` }} transition={{ duration: 0.32 }} style={{ height: "100%", borderRadius: 99, background: "var(--accent)" }} /></div>
        <Card className="section-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}><span className="eligibility-icon"><Icon size={17} /></span><div><p className="eyebrow" style={{ margin: 0 }}>Step {String(step + 1).padStart(2, "0")}</p><h2 style={{ margin: "3px 0 0", fontSize: 18, letterSpacing: "-.03em" }}>{current.title}</h2></div></div>
          <p style={{ margin: "0 0 15px", color: "var(--muted-strong)", fontSize: 12 }}>{current.prompt}</p>
          <div role="radiogroup" aria-label={current.prompt} style={{ display: "grid", gap: 9 }}>
            {current.options.map((option, index) => <button key={option} type="button" role="radio" aria-checked={selected === index} onClick={() => setSelected(index)} className="card" style={{ minHeight: 53, width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "0 14px", textAlign: "left", borderColor: selected === index ? "var(--accent)" : "var(--border)", background: selected === index ? "var(--accent-soft)" : "var(--surface)", color: "var(--foreground)" }}><span style={{ width: 17, height: 17, display: "grid", placeItems: "center", borderRadius: "50%", border: `1.5px solid ${selected === index ? "var(--accent)" : "var(--border-strong)"}`, color: selected === index ? "var(--accent-strong)" : "transparent" }}>{selected === index ? <Check size={11} /> : null}</span><span style={{ fontSize: 12 }}>{option}</span></button>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, paddingTop: 17, borderTop: "1px solid var(--border)" }}>
            <Button variant="ghost" disabled={step === 0} onClick={() => { setStep((value) => Math.max(0, value - 1)); setSelected(null); }}><ArrowLeft size={14} /> Back</Button>
            <Button onClick={next}>{step === steps.length - 1 ? "View readiness result" : "Continue"}<ArrowRight size={14} /></Button>
          </div>
        </Card>
        <p style={{ display: "flex", gap: 7, color: "var(--muted)", fontSize: 10, lineHeight: 1.6, marginTop: 14 }}><FileSearch2 size={13} style={{ flex: "0 0 auto" }} />This is a local interactive demonstration. It does not upload materials or run AI analysis; the result page uses sample data.</p>
      </div>
    </>
  );
}
