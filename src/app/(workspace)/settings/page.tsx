"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, CircleHelp, Download, LockKeyhole, Moon, Monitor, Sun, UserRound, Bell, Database, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, PageTitle } from "@/components/ui/primitives";
import { useProfile } from "@/components/profile-provider";

const sections = ["Account", "Appearance", "Notifications", "Privacy", "Data"];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile, resetProfile } = useProfile();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState({ roadmap: true, assessment: true });
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => {
    setMounted(true);
    try { const stored = localStorage.getItem("verifit-notifications"); if (stored) setNotifications(JSON.parse(stored) as typeof notifications); } catch { /* keep demo defaults */ }
  }, []);

  function setNotification(key: "roadmap" | "assessment", value: boolean) {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    try { localStorage.setItem("verifit-notifications", JSON.stringify(updated)); } catch { /* ignore */ }
    toast.success("Notification preference saved");
  }

  function exportSample() {
    const blob = new Blob([JSON.stringify({ profile, note: "Sample data from the VeriFit frontend demo." }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "verifit-sample-profile.json"; anchor.click(); URL.revokeObjectURL(url);
    toast.success("Sample profile exported");
  }

  function clearDemoData() {
    ["verifit-roadmap", "verifit-notifications"].forEach((key) => localStorage.removeItem(key));
    resetProfile();
    setConfirmClear(false); setNotifications({ roadmap: true, assessment: true });
    toast.success("Local demo changes cleared", { description: "The sample profile is still available." });
  }

  return <>
    <PageTitle eyebrow="Workspace preferences" title="Settings" description="Manage your demo account, appearance, notifications, privacy, and data." />
    <div className="settings-layout">
      <nav aria-label="Settings sections" className="card" style={{ padding: 8, position: "sticky", top: 76 }}>{sections.map((section) => <a key={section} href={`#${section.toLowerCase()}`} className="nav-link" style={{ marginBottom: 2 }}>{section}</a>)}</nav>
      <div style={{ display: "grid", gap: 13, minWidth: 0 }}>
        <Card id="account" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><UserRound size={15} style={{ color: "var(--accent)" }} /><h2>Account</h2></div><p>Profile details used in this local demonstration.</p></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><strong style={{ display: "block", fontSize: 12 }}>{profile.name}</strong><span className="text-muted" style={{ fontSize: 10 }}>Student · {profile.branch}</span></div><Link href="/profile" className="button button-outline button-sm">Edit profile</Link></div></Card>

        <Card id="appearance" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Sun size={15} style={{ color: "var(--accent)" }} /><h2>Appearance</h2></div><p>Choose the theme used across the entire VeriFit workspace.</p></div><div className="segmented" role="group" aria-label="Appearance theme">
          {[{ name: "light", label: "Light", icon: Sun }, { name: "dark", label: "Dark", icon: Moon }, { name: "system", label: "System", icon: Monitor }].map(({ name, label, icon: Icon }) => <button key={name} type="button" aria-pressed={mounted && theme === name} onClick={() => { setTheme(name); toast.success(`${label} appearance enabled`); }}><Icon size={13} />{label}{mounted && theme === name ? <Check size={12} /> : null}</button>)}
        </div></Card>

        <Card id="notifications" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Bell size={15} style={{ color: "var(--accent)" }} /><h2>Notifications</h2></div><p>Choose which local demo reminders are shown.</p></div>{([{ key: "roadmap", label: "Roadmap milestone reminders", description: "Updates when you start or complete a milestone." }, { key: "assessment", label: "Assessment updates", description: "A reminder when your sample assessment is ready to review." }] as const).map(({ key, label, description }) => <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "11px 0", borderBottom: key === "roadmap" ? "1px solid var(--border)" : 0, cursor: "pointer" }}><span><strong style={{ display: "block", fontSize: 11 }}>{label}</strong><small className="text-muted" style={{ fontSize: 10 }}>{description}</small></span><input type="checkbox" checked={notifications[key]} onChange={(event) => setNotification(key, event.target.checked)} aria-label={label} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} /></label>)}</Card>

        <Card id="privacy" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><LockKeyhole size={15} style={{ color: "var(--accent)" }} /><h2>Privacy</h2></div><p>This MVP uses local mock data and does not connect to a backend.</p></div><div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 12, borderRadius: 8, background: "var(--surface-soft)" }}><CircleHelp size={14} style={{ color: "var(--muted)", flex: "0 0 auto" }} /><p style={{ margin: 0, fontSize: 11, lineHeight: 1.65, color: "var(--muted-strong)" }}>Profile edits and roadmap preferences are kept in this browser for the demo. Resume files are previewed locally in your session; no upload, identity provider, or server-side processing is configured.</p></div></Card>

        <Card id="data" className="form-section"><div className="form-section-heading"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Database size={15} style={{ color: "var(--accent)" }} /><h2>Data</h2></div><p>Export the sample profile or clear local changes made in this browser.</p></div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Button variant="outline" size="sm" onClick={exportSample}><Download size={13} /> Export sample profile</Button><Button variant="ghost" size="sm" onClick={() => setConfirmClear((value) => !value)}><Trash2 size={13} /> Clear demo changes</Button></div>{confirmClear ? <div role="group" aria-label="Confirm clearing demo data" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 13, padding: 12, borderRadius: 8, background: "var(--red-soft)", fontSize: 11 }}><span>Clear this browser&apos;s profile, roadmap, and notification edits?</span><span style={{ display: "flex", gap: 7 }}><Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>Cancel</Button><Button size="sm" variant="outline" onClick={clearDemoData}><Trash2 size={12} /> Clear</Button></span></div> : null}</Card>
      </div>
    </div>
  </>;
}
