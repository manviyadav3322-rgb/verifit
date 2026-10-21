import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ProfileProvider } from "@/components/profile-provider";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { getCurrentUser } from "@/lib/auth/server";
import { getProfile } from "@/lib/data/profile";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile] = await Promise.all([getProfile(user.id)]);
  return <ProfileProvider initialProfile={profile}><WorkspaceShell user={{ id: user.id, email: user.email, displayName: user.displayName, role: user.role }}>{children}</WorkspaceShell></ProfileProvider>;
}
