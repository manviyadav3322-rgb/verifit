"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui/primitives";
import { useProfile, type ProfileData } from "@/components/profile-provider";

type ProfileFormState = { name: string; college: string; degree: string; branch: string; graduationYear: string; cgpa: string; backlogCount: string; certifications: string; github: string; linkedin: string };
const toForm = (value: ProfileData): ProfileFormState => ({ name: value.name, college: value.college, degree: value.degree, branch: value.branch, graduationYear: value.graduationYear, cgpa: value.cgpa, backlogCount: value.backlogCount, certifications: value.certifications.join(", "), github: value.github, linkedin: value.linkedin });
const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function ProfileEditor() {
  const { profile, updateProfile } = useProfile();
  const [form, setForm] = useState<ProfileFormState>(() => toForm(profile));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(toForm(profile)); }, [profile]);
  function update(key: keyof ProfileFormState, value: string) { setForm((current) => ({ ...current, [key]: value })); setSaved(false); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try {
      await updateProfile({ name: form.name.trim() || "Student", college: form.college, degree: form.degree, branch: form.branch, graduationYear: form.graduationYear, cgpa: form.cgpa, backlogCount: form.backlogCount, certifications: splitList(form.certifications), github: form.github, linkedin: form.linkedin });
      setSaved(true); toast.success("Profile saved", { description: "Your account profile has been updated in the database." });
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Profile could not be saved."); }
    finally { setSaving(false); }
  }

  const field = (key: keyof ProfileFormState, label: string, hint?: string) => <div className="form-field" key={key}><label htmlFor={`profile-${key}`}>{label}</label><input id={`profile-${key}`} value={form[key]} onChange={(event) => update(key, event.target.value)} />{hint ? <span className="helper-text">{hint}</span> : null}</div>;

  return <form onSubmit={save}>
    <Card className="form-section"><div className="form-section-heading"><h2>Personal details</h2><p>Used to personalize your workspace and evaluate explicitly configured eligibility rules.</p></div><div className="form-grid"><div className="form-field"><label htmlFor="profile-email">Verified account email</label><input id="profile-email" value={profile.email} readOnly disabled /><span className="helper-text">Managed by your Manus identity.</span></div>{field("name", "Name")}{field("college", "College")}{field("degree", "Degree")}{field("branch", "Branch")}{field("graduationYear", "Graduation year", "Enter a four-digit year.")}{field("cgpa", "CGPA", "Scale: 0 to 10")}{field("backlogCount", "Backlogs", "Used only when a job publishes a matching eligibility rule.")}</div></Card>
    <Card className="form-section"><div className="form-section-heading"><h2>Certifications and professional links</h2><p>Store certifications and public profile references as user-owned data.</p></div><div className="form-grid">{field("certifications", "Certifications", "Separate entries with commas")}{field("github", "GitHub URL")}{field("linkedin", "LinkedIn URL")}</div><div className="form-footer"><Button type="submit" disabled={saving}>{saved ? <Check size={14} /> : <Save size={14} />}{saving ? "Saving…" : saved ? "Saved" : "Save changes"}</Button></div></Card>
    <Card className="form-section"><div className="form-section-heading"><h2>Portfolio records</h2><p>Skills and projects are separately stored records, with their own create, edit, search, sort, and archive flows.</p></div><div className="portfolio-summary"><div><span className="detail-label">Skills</span><p>{profile.skills.length ? profile.skills.join(" · ") : "No skill records yet."}</p><Link href="/skills" className="table-action">Manage skills</Link></div><div><span className="detail-label">Projects</span><p>{profile.projects.length ? profile.projects.join(" · ") : "No project records yet."}</p><Link href="/projects" className="table-action">Manage projects</Link></div></div></Card>
  </form>;
}
