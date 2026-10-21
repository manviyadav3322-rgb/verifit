"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, CheckCircle2, FileSearch2, ShieldCheck, Waypoints } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

const previewRows = [
  ["Supporting citation", "Evidence", "MET"],
  ["Incomplete evidence", "Evidence", "PARTIAL"],
  ["No current support", "Evidence", "NOT EVIDENCED"],
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <Brand />
        <div className="landing-nav-links"><a href="#how-it-works">How it works</a><Link href="/roles">Explore roles</Link></div>
        <div className="landing-actions"><ThemeToggle /><Link href="/login" className="button button-outline button-sm">Sign in</Link><Link href="/assessment" className="button button-primary button-sm">Check readiness <ArrowRight size={14} /></Link></div>
      </nav>

      <section className="hero-wrap">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
          <div className="hero-kicker"><span className="hero-kicker-dot" /> READINESS, BACKED BY EVIDENCE</div>
          <h1 className="hero-title">Know exactly why you&apos;re ready.</h1>
          <p className="hero-description">VeriFit checks every job requirement against evidence from your resume, separates eligibility rules from skill fit, and gives you a roadmap you can actually verify.</p>
          <div className="hero-buttons"><Link href="/assessment" className="button button-primary button-md">Check my readiness <ArrowRight size={15} /></Link><a href="#how-it-works" className="button button-outline button-md">See how it works <ArrowDown size={14} /></a></div>
          <div className="hero-note"><CheckCircle2 size={15} /> No hiring predictions. Just clear evidence and next steps.</div>
        </motion.div>

        <motion.div className="preview-frame" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }} aria-label="Illustrative view of evidence status logic">
          <div className="preview-window">
            <div className="preview-topline"><div className="preview-dots"><i /><i /><i /></div><span>verifit.app / evidence preview</span><span>· · ·</span></div>
            <div className="preview-content">
              <div className="preview-heading"><div><strong>Evidence status examples</strong><p>Illustrative only — no student or job records.</p></div><div className="preview-pass"><ShieldCheck size={13} /> RULES ARE SEPARATE</div></div>
              <div className="preview-table-head"><span>Evidence state</span><span>Basis</span><span>Verdict</span></div>
              {previewRows.map(([name, type, status]) => <div className="preview-row" key={name}><span>{name}</span><span>{type}</span><span>{status === "MET" ? <span style={{ color: "var(--green)" }}>✓&nbsp; MET</span> : status === "PARTIAL" ? <span style={{ color: "var(--amber)" }}>◐&nbsp; PARTIAL</span> : <span style={{ color: "var(--muted-strong)" }}>○&nbsp; NOT EVIDENCED</span>}</span></div>)}
            </div>
          </div>
          <div className="preview-float"><span className="preview-float-icon"><FileSearch2 size={15} /></span><span><strong>Evidence you can verify</strong><small>Source citations, not keyword scores</small></span></div>
        </motion.div>
      </section>

      <section className="landing-proof" id="how-it-works" aria-label="How VeriFit works">
        <div className="proof-item"><span className="proof-icon"><ShieldCheck size={16} /></span><div><strong>Eligibility stays separate</strong><p>Hard rules such as CGPA, branch, and graduation year are checked on their own.</p></div></div>
        <div className="proof-item"><span className="proof-icon"><FileSearch2 size={16} /></span><div><strong>Every verdict has context</strong><p>See the exact resume or project text behind MET, PARTIAL, and NOT EVIDENCED.</p></div></div>
        <div className="proof-item"><span className="proof-icon"><Waypoints size={16} /></span><div><strong>Gaps become next steps</strong><p>Follow small actions that turn missing or incomplete evidence into something verifiable.</p></div></div>
      </section>
      <footer className="landing-footer"><span>© 2026 VeriFit</span><span>Evidence-grounded readiness · No placement predictions.</span><Link href="/login" style={{ color: "var(--muted-strong)", textDecoration: "none" }}>Sign in <ArrowRight size={12} style={{ verticalAlign: "middle" }} /></Link></footer>
    </main>
  );
}
