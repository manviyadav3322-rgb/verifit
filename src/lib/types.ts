export type UserRole = "student" | "admin";

export type PublicUser = {
  id: string;
  email: string | null;
  displayName: string;
  role: UserRole;
};

export type ProfileData = {
  name: string;
  email: string;
  college: string;
  degree: string;
  branch: string;
  graduationYear: string;
  cgpa: string;
  backlogCount: string;
  github: string;
  linkedin: string;
  skills: string[];
  projects: string[];
  certifications: string[];
};
