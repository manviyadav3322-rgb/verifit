"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { BriefcaseBusiness, CheckCircle2, ChevronRight, ClipboardCheck, FileText, LayoutDashboard, Menu, Route, Settings2, ShieldCheck, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProfile } from "@/components/profile-provider";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessment", icon: ClipboardCheck },
  { label: "Roles", href: "/roles", icon: BriefcaseBusiness },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Roadmap", href: "/roadmap", icon: Route },
  { label: "Audit", href: "/audit", icon: ShieldCheck },
];

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assessment": "Assessments",
  "/assessment/result": "Assessment result",
  "/roles": "Roles",
  "/profile": "Profile",
  "/resume": "Resume",
  "/roadmap": "Roadmap",
  "/audit": "System audit",
  "/settings": "Settings",
};

function NavItems({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="nav-list" aria-label="Main navigation">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href === "/assessment" && pathname.startsWith("/assessment"));
        return (
          <Link key={href} href={href} onClick={onNavigate} className={cn("nav-link", active && "active")} aria-current={active ? "page" : undefined}>
            <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserBlock() {
  const { profile } = useProfile();
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <Link href="/profile" className="sidebar-user" style={{ textDecoration: "none", color: "inherit" }}>
      <span className="avatar" aria-hidden="true">{initials || "VF"}</span>
      <span><strong>{profile.name}</strong><small>Student profile</small></span>
    </Link>
  );
}

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = pageNames[pathname] ?? "Dashboard";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="workspace">
      <aside className="sidebar" aria-label="Workspace sidebar">
        <div className="sidebar-brand"><Brand href="/dashboard" /></div>
        <p className="workspace-label">Workspace</p>
        <NavItems pathname={pathname} />
        <div className="sidebar-spacer" />
        <div className="sidebar-bottom">
          <Link href="/settings" className={cn("nav-link", pathname === "/settings" && "active")} aria-current={pathname === "/settings" ? "page" : undefined}>
            <Settings2 size={16} strokeWidth={1.8} aria-hidden="true" /><span>Settings</span>
          </Link>
          <div className="sidebar-user" style={{ justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted-strong)", fontSize: 11 }}>Appearance</span>
            <ThemeToggle />
          </div>
          <UserBlock />
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-left">
            <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
              <Dialog.Trigger asChild>
                <button type="button" className="icon-button mobile-menu-button" aria-label="Open navigation menu"><Menu size={18} /></button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="mobile-scrim" />
                <Dialog.Content className="mobile-drawer">
                  <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">Navigate to VeriFit pages</Dialog.Description>
                  <div className="mobile-drawer-header"><Brand href="/dashboard" /><Dialog.Close asChild><button className="icon-button" aria-label="Close navigation"><X size={17} /></button></Dialog.Close></div>
                  <p className="workspace-label">Workspace</p>
                  <NavItems pathname={pathname} onNavigate={() => setMenuOpen(false)} />
                  <div className="sidebar-spacer" />
                  <Link href="/settings" className="nav-link" onClick={() => setMenuOpen(false)}><Settings2 size={16} /><span>Settings</span></Link>
                  <div className="sidebar-user" style={{ justifyContent: "space-between" }}><span style={{ fontSize: 11 }}>Appearance</span><ThemeToggle /></div>
                  <UserBlock />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <span className="hide-mobile">VeriFit</span>
            <ChevronRight size={13} aria-hidden="true" />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-search"><CheckCircle2 size={13} /> Evidence-first assessment <kbd>DEMO</kbd></span>
            <ThemeToggle />
          </div>
        </header>
        <motion.main key={pathname} className="workspace-content" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
          {children}
        </motion.main>
      </div>
    </div>
  );
}
