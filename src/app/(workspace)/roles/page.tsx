"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, Search, ShieldCheck } from "lucide-react";
import { Card, PageTitle, Tag } from "@/components/ui/primitives";
import { roles } from "@/data/mock-data";
import { toast } from "sonner";

export default function RolesPage() {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => roles.filter((role) => role.title.toLowerCase().includes(query.toLowerCase())), [query]);
  return <>
    <PageTitle eyebrow="Role library" title="Explore roles" description="Compare each role's hard eligibility rules and evidence-backed skill requirements." action={<Link href="/assessment" className="button button-primary button-sm">Check my readiness <ArrowRight size={13} /></Link>} />
    <label style={{ position: "relative", display: "block", maxWidth: 380, marginBottom: 17 }}><Search size={14} style={{ position: "absolute", left: 11, top: 12, color: "var(--muted)" }} /><input className="search-input" aria-label="Search roles" placeholder="Search roles" value={query} onChange={(event) => setQuery(event.target.value)} style={{ paddingLeft: 34 }} /></label>
    {shown.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 310px),1fr))", gap: 14 }}>{shown.map((role) => {
      const coming = role.status === "soon";
      return <Card key={role.title} className="section-card" style={{ display: "flex", flexDirection: "column", minHeight: 310 }}>
        <div className="card-heading"><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="eligibility-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}><BriefcaseBusiness size={16} /></span><div><h2>{role.title}</h2><p>{coming ? "Coming soon" : role.company}</p></div></div>{coming ? <Tag><Clock3 size={11} style={{ marginRight: 4 }} /> Coming soon</Tag> : <span className="status-badge status-met"><CheckCircle2 size={12} /> Available</span>}</div>
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 7, color: "var(--muted-strong)", fontSize: 11 }}><span className="detail-label" style={{ margin: 0 }}>Requirements</span><strong>{role.requirements}</strong></div>
        <div style={{ marginTop: 16 }}><span className="detail-label">Eligibility rules</span><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>{role.eligibility.map((item) => <Tag key={item}>{item}</Tag>)}</div></div>
        <div style={{ marginTop: 14 }}><span className="detail-label">Skills</span><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>{role.skills.map((item) => <Tag key={item}>{item}</Tag>)}</div></div>
        <div style={{ marginTop: "auto", paddingTop: 18 }}>{coming ? <button type="button" className="button button-secondary button-md" style={{ width: "100%" }} onClick={() => toast("ML Engineer is coming soon", { description: "You can still preview its requirements while we prepare this assessment." })}><ShieldCheck size={14} /> Assess myself <ArrowRight size={13} /></button> : <Link href="/assessment" className="button button-primary button-md" style={{ width: "100%" }}><ShieldCheck size={14} /> Assess myself <ArrowRight size={13} /></Link>}</div>
      </Card>;
    })}</div> : <Card style={{ padding: 26, textAlign: "center" }}><BriefcaseBusiness size={20} style={{ color: "var(--muted)" }} /><h2 style={{ fontSize: 14 }}>No roles found</h2><p className="text-muted" style={{ fontSize: 11 }}>Try a different search, or clear the filter.</p><button type="button" className="button button-outline button-sm" onClick={() => setQuery("")}>Clear search</button></Card>}
  </>;
}
