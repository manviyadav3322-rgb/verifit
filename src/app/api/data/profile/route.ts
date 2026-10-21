import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeApi } from "@/lib/policies/guards";
import { getProfile, updateProfile } from "@/lib/data/profile";

const urlOrEmpty = z.string().trim().max(512).refine((value) => !value || /^https?:\/\//i.test(value), "Use an http(s) URL or leave this field empty.");
const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  college: z.string().trim().max(190).optional(),
  degree: z.string().trim().max(100).optional(),
  branch: z.string().trim().max(100).optional(),
  graduationYear: z.string().trim().max(4).refine((value) => !value || /^\d{4}$/.test(value), "Enter a four-digit year.").optional(),
  cgpa: z.string().trim().max(5).refine((value) => !value || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10), "CGPA must be between 0 and 10.").optional(),
  backlogCount: z.string().trim().max(3).refine((value) => !value || (/^\d+$/.test(value) && Number(value) <= 999), "Enter a non-negative backlog count.").optional(),
  github: urlOrEmpty.optional(),
  linkedin: urlOrEmpty.optional(),
  certifications: z.array(z.string().trim().min(1).max(190)).max(40).optional(),
}).strict();

export async function GET(request: Request) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  const profile = await getProfile(auth.user.id);
  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const auth = await authorizeApi(request);
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the profile fields and try again.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const profile = await updateProfile(auth.user.id, parsed.data);
  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
}
