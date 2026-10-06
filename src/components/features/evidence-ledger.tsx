"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ExternalLink, X } from "lucide-react";
import type { Requirement } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, Card } from "@/components/ui/primitives";

function CitationConfidence({ value }: { value: number }) {
  if (!value) return <span className="text-muted">—</span>;
  return <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--muted-strong)" }}>{value}%</span>;
}

export function EvidenceLedger({ items, variant = "full" }: { items: Requirement[]; variant?: "dashboard" | "full" }) {
  const [selected, setSelected] = useState<Requirement | null>(null);
  const compact = variant === "dashboard";

  function openRow(item: Requirement) { setSelected(item); }

  return (
    <>
      <div className={compact ? "card table-card" : "card table-card"}>
        {compact ? (
          <div className="table-toolbar">
            <div><h2>Requirements</h2><p>Evidence-backed view of your target role</p></div>
            <a href="/assessment/result" className="table-action">Full ledger <ExternalLink size={11} style={{ verticalAlign: "middle" }} /></a>
          </div>
        ) : null}
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr>
              <th>Requirement</th><th>Type</th><th>{compact ? "Status" : "Verdict"}</th><th>Evidence</th>{!compact ? <th>Confidence</th> : null}<th>Action</th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} tabIndex={0} aria-label={`Open evidence details for ${item.name}`} onClick={() => openRow(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRow(item); } }}>
                  <td className="table-primary">{item.name}</td>
                  <td>{item.type}</td>
                  <td>{compact && item.type === "Eligibility" ? <span className="status-badge status-met"><Check size={13} /> PASSED</span> : <StatusBadge verdict={item.verdict} />}</td>
                  <td>{item.evidence ? <span className="evidence-cell">{item.source?.split(" · ")[0] ?? "Evidence"}<span className="table-sub">{item.source?.split(" · ").slice(1).join(" · ") ?? "Citation available"}</span></span> : <span className="text-muted">Not found</span>}</td>
                  {!compact ? <td><CitationConfidence value={item.confidence} /></td> : null}
                  <td><button type="button" className="table-action" aria-label={`View evidence for ${item.name}`} onClick={(event) => { event.stopPropagation(); openRow(item); }}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="drawer-overlay" />
          <Dialog.Content className="drawer-content" aria-describedby="evidence-drawer-description">
            {selected ? <>
              <div className="drawer-header">
                <div><p className="eyebrow" style={{ marginBottom: 5 }}>Evidence detail</p><Dialog.Title>{selected.name}</Dialog.Title><Dialog.Description id="evidence-drawer-description">Source material and verdict for this requirement.</Dialog.Description></div>
                <Dialog.Close asChild><button type="button" className="icon-button" aria-label="Close evidence details"><X size={17} /></button></Dialog.Close>
              </div>
              <div className="drawer-body">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}><span className="tag">{selected.type}</span><StatusBadge verdict={selected.verdict} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 21 }}>
                  <div><span className="detail-label">Requirement</span><strong style={{ fontSize: 12 }}>{selected.name}</strong></div>
                  <div><span className="detail-label">Citation confidence</span><strong style={{ fontSize: 12 }}>{selected.confidence ? `${selected.confidence}%` : "No citation"}</strong></div>
                </div>
                {selected.evidence ? <>
                  <div style={{ marginBottom: 8 }}><span className="detail-label">Source · {selected.source ?? "Resume"}</span></div>
                  <blockquote className="evidence-quote"><mark>{selected.evidence}</mark></blockquote>
                  <div className="check-list" aria-label="Evidence validation steps">
                    <div className="check-item"><Check size={15} /> Evidence found</div>
                    <div className="check-item"><Check size={15} /> Requirement matched</div>
                    <div className="check-item"><Check size={15} /> Citation verified</div>
                  </div>
                </> : <div className="empty-evidence"><strong>No supporting evidence was found in your current materials.</strong><br />NOT EVIDENCED does not mean you do not know this skill. It means the evidence currently available does not demonstrate it.</div>}
                {selected.action ? <Card style={{ marginTop: 20, padding: 15 }}><span className="detail-label">Suggested evidence action</span><p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.6 }}>{selected.action}</p></Card> : null}
                <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}><Dialog.Close asChild><Button variant="secondary"><X size={14} /> Close</Button></Dialog.Close></div>
              </div>
            </> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
