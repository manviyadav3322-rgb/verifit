import { redirect } from "next/navigation";
import { WorkflowWorkspace } from "@/components/features/workflow-workspace";
import { getCurrentUser } from "@/lib/auth/server";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <WorkflowWorkspace kind="audit" />;
}
