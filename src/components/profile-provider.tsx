"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ProfileData } from "@/lib/types";

export type { ProfileData } from "@/lib/types";
type ProfileContextValue = { profile: ProfileData; updateProfile: (changes: Partial<ProfileData>) => Promise<ProfileData> };
const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children, initialProfile }: { children: ReactNode; initialProfile: ProfileData }) {
  const [current, setCurrent] = useState(initialProfile);
  const updateProfile = useCallback(async (changes: Partial<ProfileData>) => {
    const response = await fetch("/api/data/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const result = await response.json() as { profile?: ProfileData; error?: string };
    if (!response.ok || !result.profile) throw new Error(result.error ?? "Profile could not be saved.");
    setCurrent(result.profile);
    return result.profile;
  }, []);
  const value = useMemo(() => ({ profile: current, updateProfile }), [current, updateProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
