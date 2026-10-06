"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui/primitives";
import { useProfile, type ProfileData } from "@/components/profile-provider";

type ProfileFormState = { name: string; college: string; degree: string; branch: string; graduationYear: string; cgpa: string; backlogCount: string; skills: string; projects: string; certifications: string; github: string; linkedin: string };
const toForm = (value: ProfileData): ProfileFormState => ({ ...value, skills: value.skills.join(", "), projects: value.projects.join(", "), certifications: value.certifications.join(", ") });
const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export function ProfileEditor() {
  const { profile, updateProfile } = useProfile();
  const [form, setForm] = useState<ProfileFormState>(() => toForm(profile));
  const [saved, setSaved] = useState(false);
  useEffect(() => { setForm(toForm(profile)); }, [profile]);

  function update(key: keyof ProfileFormState, value: string) { setForm((current) => ({ ...current, [key]: value })); setSaved(false); }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfile({
      name: form.name.trim() || "Student",
      college: form.college,
      degree: form.degree,
      branch: form.branch,
      graduationYear: form.graduationYear,
      cgpa: form.cgpa,
      backlogCount: form.backlogCount,
      skills: splitList(form.skills),
      projects: splitList(form.projects),
      certifications: splitList(form.certifications),
      github: form.github,
      linkedin: form.linkedin,
    });
    setSaved(true);
    toast.success("Profile saved", { description: "Your edits now appear across this demo workspace." });
  }

  const field = (key: keyof ProfileFormState, label: string, hint?: string) => <div className="form-field" key={key}><label htmlFor={key}>{label}</label><input id={key} value={form[key]} onChange={(event) => update(key, event.target.value)} />{hint ? <span className="helper-text">{hint}</span> : null}</div>;

  return <form onSubmit={save}>
    <Card className="form-section">
      <div className="form-section-heading"><h2>Personal details</h2><p>Used to personalize your readiness workspace and eligibility checks.</p></div>
      <div className="form-grid">{field("name", "Name")}{field("college", "College")}{field("degree", "Degree")}{field("branch", "Branch")}{field("graduationYear", "Graduation year")}{field("cgpa", "CGPA", "Scale: 10.0")}{field("backlogCount", "Backlogs", "Used by the sample eligibility check")}</div>
    </Card>
    <Card className="form-section">
      <div className="form-section-heading"><h2>Evidence and skills</h2><p>Separate what you know from what your current materials demonstrate.</p></div>
      <div className="form-grid">{field("skills", "Skills", "Separate entries with commas")}{field("projects", "Projects", "Separate entries with commas")}{field("certifications", "Certifications", "Separate entries with commas")}</div>
    </Card>
    <Card className="form-section">
      <div className="form-section-heading"><h2>Professional links</h2><p>Optional references to your work and public profile.</p></div>
      <div className="form-grid">{field("github", "GitHub")}{field("linkedin", "LinkedIn")}</div>
      <div className="form-footer"><Button type="submit">{saved ? <Check size={14} /> : <Save size={14} />}{saved ? "Saved" : "Save changes"}</Button></div>
    </Card>
  </form>;
}
