import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { scoreResumeAgainstRequirements } from "@/lib/ai-scoring";
import { getAuthSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getAuthSession();
  if (!session?.user || session.user.role !== Role.APPLICANT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { resumeText?: string; jobDescription?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const resumeText = body.resumeText?.trim() || "";
  const jobDescription = body.jobDescription?.trim() || "";

  if (!resumeText || !jobDescription) {
    return NextResponse.json({ error: "resumeText and jobDescription are required." }, { status: 400 });
  }

  const result = await scoreResumeAgainstRequirements(resumeText, jobDescription);

  return NextResponse.json({ result });
}