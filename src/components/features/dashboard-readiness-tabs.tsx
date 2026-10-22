"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

type Verdict = "MET" | "PARTIAL" | "NOT EVIDENCED";
type ReadinessSummary = { met: number; partial: number; notEvidenced: number };
type ReadinessRow = {
  requirementId: string;
  requirementName: string;
  requirementKind: string;
  verdict: Verdict;
  evidenceCount: number;
};

export function DashboardReadinessTabs({ summary, rows }: { summary: ReadinessSummary; rows: ReadinessRow[] }) {
  const [selected, setSelected] = useState<Verdict | null>(null);
  const options: Array<{ verdict: Verdict; label: string; count: number; tone: string }> = [
    { verdict: "MET", label: "Met", count: summary.met, tone: "met" },
    { verdict: "PARTIAL", label: "Partial", count: summary.partial, tone: "partial" },
    { verdict: "NOT EVIDENCED", label: "Not evidenced", count: summary.notEvidenced, tone: "missing" },
  ];
  const visibleRows = selected ? rows.filter((row) => row.verdict === selected) : rows;

  return <>
    <div className="readiness-status-tabs" role="group" aria-label="Filter requirements by evidence status">
      {options.map(({ verdict, label, count, tone }) => <button
        key={verdict}
        type="button"
        className={`readiness-status-tab readiness-status-tab--${tone}`}
        aria-pressed={selected === verdict}
        aria-label={`${label}: ${count} requirements`}
        onClick={() => setSelected((current) => current === verdict ? null : verdict)}
      >
        <span className="readiness-status-dot" aria-hidden="true" />
        <span>{label}</span>
        <span className="readiness-status-count" aria-hidden="true">{count}</span>
      </button>)}
    </div>
    <p className="sr-only" aria-live="polite">
      Showing {visibleRows.length} of {rows.length} requirements{selected ? ` with status ${selected}` : " across all statuses"}.
    </p>
    {visibleRows.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Requirement</th><th>Type</th><th>Status</th><th>Evidence</th></tr></thead><tbody>
      {visibleRows.map((row) => <tr key={row.requirementId}><td>{row.requirementName}</td><td>{row.requirementKind}</td><td><StatusBadge verdict={row.verdict} /></td><td>{row.evidenceCount} source{row.evidenceCount === 1 ? "" : "s"}</td></tr>)}
    </tbody></table></div> : <p className="data-empty-inline">{rows.length ? `No requirements are marked ${selected?.toLowerCase()} in this assessment. Select the status again to show all requirements.` : "No requirement results are stored for this assessment yet."}</p>}
  </>;
}
