import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";
import { findMatchingJobs } from "@/lib/recruiter-tools";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== Role.APPLICANT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { resumeText?: string; topK?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const resumeText = body.resumeText?.trim() || "";
  const topK = Number.isFinite(body.topK as number) ? Number(body.topK) : 5;

  const result = await findMatchingJobs({
    applicantId: resumeText ? undefined : session.user.id,
    resumeText: resumeText || undefined,
    topK: Math.max(1, Math.min(10, topK)),
  });

  return NextResponse.json({ result });
}