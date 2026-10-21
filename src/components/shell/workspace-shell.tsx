"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Activity, BookOpen, BriefcaseBusiness, CheckCircle2, ChevronRight, ClipboardCheck, FileSearch2, FileText, FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, Route, Settings2, ShieldCheck, UserRound, Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProfile } from "@/components/profile-provider";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Eligibility", href: "/eligibility", icon: ShieldCheck },
  { label: "Assessments", href: "/assessment", icon: ClipboardCheck },
  { label: "Skills", href: "/skills", icon: ListChecks },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Evidence library", href: "/evidence", icon: FileSearch2 },
  { label: "Evidence gaps", href: "/gaps", icon: Activity },
  { label: "Roadmap", href: "/roadmap", icon: Route },
  { label: "Applications", href: "/applications", icon: CheckCircle2 },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "History", href: "/history", icon: Activity },
  { label: "Reports", href: "/reports", icon: FileText },
];

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard", "/assessment": "Assessments", "/assessment/result": "Assessment result",
  "/jobs": "Jobs", "/eligibility": "Eligibility", "/skills": "Skills", "/projects": "Projects",
  "/evidence": "Evidence library", "/gaps": "Evidence gaps", "/applications": "Applications",
  "/resume": "Resume", "/roadmap": "Roadmap", "/resources": "Resources", "/profile": "Profile",
  "/history": "History", "/reports": "Reports", "/audit": "Audit history", "/admin": "Admin management", "/settings": "Settings",
};

function NavItems({ pathname, onNavigate, isAdmin }: { pathname: string; onNavigate?: () => void; isAdmin: boolean }) {
  const links = isAdmin ? [...navigation, { label: "Admin", href: "/admin", icon: Users }, { label: "Audit history", href: "/audit", icon: Activity }] : navigation;
  return <nav className="nav-list" aria-label="Main navigation">
    {links.map(({ label, href, icon: Icon }) => {
      const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
      return <Link key={href} href={href} onClick={onNavigate} className={cn("nav-link", active && "active")} aria-current={active ? "page" : undefined}>
        <Icon size={16} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span>
      </Link>;
    })}
  </nav>;
}

function UserBlock({ role }: { role: PublicUser["role"] }) {
  const { profile } = useProfile();
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <Link href="/profile" className="sidebar-user" style={{ textDecoration: "none", color: "inherit" }}>
    <span className="avatar" aria-hidden="true">{initials || "VF"}</span>
    <span style={{ minWidth: 0 }}><strong>{profile.name || "Student"}</strong><small>{role === "admin" ? "Administrator" : "Student"}</small></span>
  </Link>;
}

export function WorkspaceShell({ children, user }: { children: ReactNode; user: PublicUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageNames[pathname] ?? (pathname.startsWith("/jobs/") ? "Job details" : "Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST", headers: { "X-VeriFit-Origin": window.location.origin } }); } finally { router.replace("/login"); router.refresh(); }
  }

  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Workspace sidebar">
        <div className="sidebar-brand"><Brand href="/dashboard" /></div>
        <p className="workspace-label">Workspace</p>
        <NavItems pathname={pathname} isAdmin={user.role === "admin"} />
        <div className="sidebar-spacer" />
        <div className="sidebar-bottom">
          <Link href="/settings" className={cn("nav-link", pathname === "/settings" && "active")} aria-current={pathname === "/settings" ? "page" : undefined}><Settings2 size={16} strokeWidth={1.8} aria-hidden="true" /><span>Settings</span></Link>
          <div className="sidebar-user" style={{ justifyContent: "space-between" }}><span style={{ color: "var(--muted-strong)", fontSize: 11 }}>Appearance</span><ThemeToggle /></div>
          <UserBlock role={user.role} />
          <button type="button" className="nav-link logout-link" onClick={logout} disabled={loggingOut}><LogOut size={16} /><span>{loggingOut ? "Signing out…" : "Sign out"}</span></button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-left">
            <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger asChild><button type="button" className="icon-button mobile-menu-button" aria-label="Open navigation menu"><Menu size={18} /></button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="mobile-scrim" />
                <Dialog.Content className="mobile-drawer">
                  <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">Navigate to VeriFit pages</Dialog.Description>
                  <div className="mobile-drawer-header"><Brand href="/dashboard" /><Dialog.Close asChild><button className="icon-button" aria-label="Close navigation"><X size={17} /></button></Dialog.Close></div>
                  <p className="workspace-label">Workspace</p>
                  <NavItems pathname={pathname} isAdmin={user.role === "admin"} onNavigate={() => setMenuOpen(false)} />
                  <Link href="/settings" className="nav-link" onClick={() => setMenuOpen(false)}><Settings2 size={16} /><span>Settings</span></Link>
                  <div className="sidebar-user" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11 }}>Appearance</span><ThemeToggle /></div>
                  <UserBlock role={user.role} />
                  <button type="button" className="nav-link logout-link" onClick={logout} disabled={loggingOut}><LogOut size={16} /><span>Sign out</span></button>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <span className="hide-mobile">VeriFit</span><ChevronRight size={13} aria-hidden="true" /><strong>{title}</strong>
          </div>
          <div className="topbar-actions"><span className="topbar-search"><ShieldCheck size={13} /> Evidence, not prediction <kbd>{user.role === "admin" ? "ADMIN" : "STUDENT"}</kbd></span><ThemeToggle /></div>
        </header>
        <motion.main key={pathname} className="workspace-content" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>{children}</motion.main>
      </div>
    </div>
  );
}
