import { PageTitle } from "@/components/ui/primitives";
import { ResumeManager } from "@/components/features/resume-manager";

export default function ResumePage() {
  return <><PageTitle eyebrow="Your materials" title="Resume" description="Manage the document that supports your evidence ledger." /><div style={{ maxWidth: 860 }}><ResumeManager /></div></>;
}
