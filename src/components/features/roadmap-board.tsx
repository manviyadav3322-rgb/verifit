"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCheck, Play, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { roadmap } from "@/data/mock-data";
import { Button, Card, Tag } from "@/components/ui/primitives";
import { StatusBadge } from "@/components/ui/status-badge";

type StepState = "Not started" | "In progress" | "Completed";

export function RoadmapBoard() {
  const [states, setStates] = useState<Record<string, StepState>>({});
  useEffect(() => {
    try { const stored = localStorage.getItem("verifit-roadmap"); if (stored) setStates(JSON.parse(stored) as Record<string, StepState>); } catch { /* demo state is optional */ }
  }, []);

  function updateState(id: string, next: StepState) {
    const updated = { ...states, [id]: next };
    setStates(updated);
    try { localStorage.setItem("verifit-roadmap", JSON.stringify(updated)); } catch { /* storage may be unavailable */ }
    toast.success(next === "Completed" ? "Milestone marked complete" : "Milestone started", { description: "Your demo roadmap progress is saved in this browser." });
  }

  return (
    <div className="roadmap-list">
      {roadmap.map((item) => {
        const status = states[item.id] ?? item.initialStatus as StepState;
        return (
          <Card key={item.id} className="milestone-card">
            <div className="milestone-top">
              <span className="milestone-number">{item.id}</span>
              <div className="milestone-main"><h2>{item.title}</h2><p>Requirement: <strong style={{ color: "var(--muted-strong)", fontWeight: 620 }}>{item.requirement}</strong></p></div>
              <Tag>{status}</Tag>
            </div>
            <div className="milestone-details">
              <div><span className="detail-label">Effort</span><span className="detail-value">{item.effort}</span></div>
              <div><span className="detail-label">Evidence required</span><span className="detail-value">{item.evidence}</span></div>
              <div><span className="detail-label">Status</span><span className="detail-value">{status}</span></div>
            </div>
            <div className="transition-strip" aria-label={`${item.requirement}: ${item.currentState}, action ${item.title}, expected ${item.expectedState}`}>
              <div className="transition-state"><small>Current state</small>{item.currentState === "NOT EVIDENCED" ? <StatusBadge verdict="NOT EVIDENCED" /> : <StatusBadge verdict={item.currentState as "MET" | "PARTIAL"} />}</div>
              <ArrowRight size={15} className="transition-arrow" aria-hidden="true" />
              <div className="transition-state" style={{ flex: 1 }}><small>Action</small><strong>{item.title}</strong></div>
              <ArrowRight size={15} className="transition-arrow" aria-hidden="true" />
              <div className="transition-state"><small>Expected verified state</small><StatusBadge verdict="MET" /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 15 }}>
              <Link href="/assessment/result" className="table-action">View requirement evidence</Link>
              {status === "Not started" ? <Button size="sm" onClick={() => updateState(item.id, "In progress")}><Play size={12} /> Start milestone</Button> : status === "In progress" ? <Button size="sm" onClick={() => updateState(item.id, "Completed")}><Check size={13} /> Mark complete</Button> : <Button size="sm" variant="secondary" onClick={() => updateState(item.id, "Not started")}><CheckCheck size={13} /> Completed</Button>}
            </div>
          </Card>
        );
      })}
      <Card style={{ padding: 17, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, background: "var(--surface-soft)" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="eligibility-icon" style={{ width: 30, height: 30, background: "var(--surface)" }}><UploadCloud size={15} /></span><div><strong style={{ display: "block", fontSize: 11 }}>Turn completed work into evidence</strong><span className="text-muted" style={{ fontSize: 10 }}>Add a project link or update the evidence in your profile.</span></div></div>
        <Link href="/profile" className="button button-outline button-sm">Update profile <ArrowRight size={12} /></Link>
      </Card>
    </div>
  );
}
