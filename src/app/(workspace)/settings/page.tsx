"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, Database, Download, LockKeyhole, Moon, Monitor, Sun, UserRound, Bell } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle } from "@/components/ui/primitives";
import { useProfile } from "@/components/profile-provider";

const sections = ["Account", "Appearance", "Notifications", "Privacy", "Data"];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile } = useProfile();
  const [mounted, setMounted] = useState(false);
  const [exporting, setExporting] = useState(false);
  useEffect(() => setMounted(true), []);

  async function exportReport() {
    setExporting(true);
    try {
      const response = await fetch("/api/data/export", { cache: "no-store" });
      if (!response.ok) throw new Error("The report export could not be prepared.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "verifit-report.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally { setExporting(false); }
  }

  return <>
    <PageTitle eyebrow="Workspace preferences" title="Settings" description="Manage account preferences and personal data." />
    <div className="settings-layout">
      <nav aria-label="Settings sections" className="card settings-nav" style={{ padding: 8 }}>{sections.map((section) => <a key={section} href={`#${section.toLowerCase()}`} className="nav-link" style={{ marginBottom: 2 }}>{section}</a>)}</nav>
      <div style={{ display: "grid", gap: 13, minWidth: 0 }}>
        <Card id="account" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><UserRound size={15} style={{ color: "var(--accent)" }} /><h2>Account</h2></div><p>Verified identity and persisted profile details.</p></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><strong style={{ display: "block", fontSize: 12 }}>{profile.name}</strong><span className="text-muted" style={{ fontSize: 10 }}>{profile.email || "Email not shared"} · {profile.branch || "Branch not set"}</span></div><Link href="/profile" className="button button-outline button-sm">Edit profile</Link></div><p className="text-muted" style={{ margin: "12px 0 0", fontSize: 10 }}>Sign-in is handled by Manus OAuth; VeriFit does not store passwords.</p></Card>
        <Card id="appearance" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Sun size={15} style={{ color: "var(--accent)" }} /><h2>Appearance</h2></div><p>Choose the theme used across the entire VeriFit workspace.</p></div><div className="segmented" role="group" aria-label="Appearance theme">{[{ name: "light", label: "Light", icon: Sun }, { name: "dark", label: "Dark", icon: Moon }, { name: "system", label: "System", icon: Monitor }].map(({ name, label, icon: Icon }) => <button key={name} type="button" aria-pressed={mounted && theme === name} onClick={() => { setTheme(name); toast.success(`${label} appearance enabled`); }}><Icon size={13} />{label}{mounted && theme === name ? <Check size={12} /> : null}</button>)}</div></Card>
        <Card id="notifications" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bell size={15} style={{ color: "var(--accent)" }} /><h2>Notifications</h2></div><p>Notification preferences are not stored until a delivery channel is configured.</p></div><p className="text-muted" style={{ fontSize: 11 }}>This workspace does not currently send email or push notifications.</p></Card>
        <Card id="privacy" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><LockKeyhole size={15} style={{ color: "var(--accent)" }} /><h2>Privacy</h2></div><p>Data access is scoped to your authenticated account and server-side role.</p></div><div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 8, background: "var(--surface-soft)" }}><LockKeyhole size={14} style={{ color: "var(--muted)", flex: "0 0 auto" }} /><p style={{ margin: 0, fontSize: 11, lineHeight: 1.65, color: "var(--muted-strong)" }}>Profiles, resumes, projects, evidence, applications, and assessments are private to your account. Administrators can review evidence matches and manage access. Resume removal is a soft delete because runtime storage does not provide physical deletion.</p></div></Card>
        <Card id="data" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Database size={15} style={{ color: "var(--accent)" }} /><h2>Data</h2></div><p>Export persisted assessment and application data.</p></div><Button variant="outline" size="sm" disabled={exporting} onClick={exportReport}><Download size={13} /> {exporting ? "Preparing report…" : "Export CSV"}</Button></Card>
      </div>
    </div>
  </>;
}
