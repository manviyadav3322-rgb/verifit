import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, studentCertifications, studentProfiles, studentSkills, users } from "@/db/schema";
import type { ProfileData } from "@/lib/types";

export async function getProfile(userId: string): Promise<ProfileData> {
  const [accountRows, profileRows, skills, userProjects, certifications] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1),
    db.select({ name: studentSkills.name }).from(studentSkills).where(eq(studentSkills.userId, userId)),
    db.select({ title: projects.title }).from(projects).where(eq(projects.userId, userId)),
    db.select({ name: studentCertifications.name }).from(studentCertifications).where(eq(studentCertifications.userId, userId)),
  ]);
  const account = accountRows[0];
  const profile = profileRows[0];
  return {
    name: account?.displayName ?? "Student",
    email: account?.email ?? "",
    college: profile?.college ?? "",
    degree: profile?.degree ?? "",
    branch: profile?.branch ?? "",
    graduationYear: profile?.graduationYear == null ? "" : String(profile.graduationYear),
    cgpa: profile?.cgpa ?? "",
    backlogCount: profile?.backlogCount == null ? "" : String(profile.backlogCount),
    github: profile?.githubUrl ?? "",
    linkedin: profile?.linkedinUrl ?? "",
    skills: skills.map((skill) => skill.name),
    projects: userProjects.map((project) => project.title),
    certifications: certifications.map((certification) => certification.name),
  };
}

export type ProfileUpdate = {
  name?: string;
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: string;
  cgpa?: string;
  backlogCount?: string;
  github?: string;
  linkedin?: string;
  certifications?: string[];
};

export async function updateProfile(userId: string, input: ProfileUpdate) {
  await db.transaction(async (tx) => {
    if (input.name !== undefined) await tx.update(users).set({ displayName: input.name.trim() || "Student" }).where(eq(users.id, userId));
    const fields = {
      ...(input.college !== undefined ? { college: input.college || null } : {}),
      ...(input.degree !== undefined ? { degree: input.degree || null } : {}),
      ...(input.branch !== undefined ? { branch: input.branch || null } : {}),
      ...(input.graduationYear !== undefined ? { graduationYear: input.graduationYear ? Number(input.graduationYear) : null } : {}),
      ...(input.cgpa !== undefined ? { cgpa: input.cgpa || null } : {}),
      ...(input.backlogCount !== undefined ? { backlogCount: input.backlogCount ? Number(input.backlogCount) : null } : {}),
      ...(input.github !== undefined ? { githubUrl: input.github || null } : {}),
      ...(input.linkedin !== undefined ? { linkedinUrl: input.linkedin || null } : {}),
    };
    if (Object.keys(fields).length) {
      await tx.insert(studentProfiles).values({ userId, ...fields }).onDuplicateKeyUpdate({ set: fields });
    }
    if (input.certifications !== undefined) {
      await tx.delete(studentCertifications).where(eq(studentCertifications.userId, userId));
      const names = [...new Set(input.certifications.map((name) => name.trim()).filter(Boolean))];
      if (names.length) await tx.insert(studentCertifications).values(names.map((name) => ({ id: randomUUID(), userId, name })));
    }
  });
  return getProfile(userId);
}
