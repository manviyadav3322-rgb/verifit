import { Check, CircleDashed, Minus } from "lucide-react";
import type { Verdict } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const styles: Record<Verdict, string> = {
  MET: "status-met",
  PARTIAL: "status-partial",
  "NOT EVIDENCED": "status-missing",
};

export function StatusBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const Icon = verdict === "MET" ? Check : verdict === "PARTIAL" ? Minus : CircleDashed;
  return (
    <span className={cn("status-badge", styles[verdict], className)}>
      <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
      <span>{verdict}</span>
    </span>
  );
}
