import { redirect } from "next/navigation";
import { WorkflowWorkspace } from "@/components/features/workflow-workspace";
import { getCurrentUser } from "@/lib/auth/server";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return <WorkflowWorkspace kind="admin" />;
}
