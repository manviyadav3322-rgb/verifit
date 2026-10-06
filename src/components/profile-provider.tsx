"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { profile as sampleProfile } from "@/data/mock-data";

export interface ProfileData {
  name: string;
  college: string;
  degree: string;
  branch: string;
  graduationYear: string;
  cgpa: string;
  backlogCount: string;
  targetRole: string;
  skills: string[];
  projects: string[];
  certifications: string[];
  github: string;
  linkedin: string;
}

const defaultProfile: ProfileData = {
  ...sampleProfile,
  skills: [...sampleProfile.skills],
  projects: [...sampleProfile.projects],
  certifications: [...sampleProfile.certifications],
};

type ProfileContextValue = { profile: ProfileData; updateProfile: (changes: Partial<ProfileData>) => void; resetProfile: () => void };
const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("verifit-profile");
      if (saved) setCurrent({ ...defaultProfile, ...JSON.parse(saved) as Partial<ProfileData> });
    } catch { /* retain the sample profile if browser storage is unavailable */ }
  }, []);

  const updateProfile = useCallback((changes: Partial<ProfileData>) => {
    setCurrent((previous) => {
      const next = { ...previous, ...changes };
      try { localStorage.setItem("verifit-profile", JSON.stringify(next)); } catch { /* state remains usable for this session */ }
      return next;
    });
  }, []);

  const resetProfile = useCallback(() => {
    setCurrent(defaultProfile);
    try { localStorage.removeItem("verifit-profile"); } catch { /* ignore storage restrictions */ }
  }, []);

  const value = useMemo(() => ({ profile: current, updateProfile, resetProfile }), [current, updateProfile, resetProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
