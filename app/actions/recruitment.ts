"use server";

import { ApplicationStatus, Role, JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/guards";
import { scheduleInterviewsWithCopilot } from "@/lib/interview-scheduling-copilot";
import { sendInterviewInvite } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { buildResumeFromProfile } from "@/lib/resume-builder";
// Default scorer is the zero-API cosine NLP scorer (synchronous) to stay within the
import { scoreResumeAgainstRequirements, polishResumeWithGroq } from "@/lib/ai-scoring";

const jobSchema = z.object({
  title: z.string().trim().min(1),
  department: z.string().trim().min(1),
  location: z.string().trim().min(1),
  employmentType: z.string().trim().min(1),
  description: z.string().trim().min(1),
  requirements: z.string().trim().min(1),
  responsibilities: z.string().trim().min(1),
  minExperience: z.number().int().min(0).max(20).optional(),
});

const scheduleSchema = z.object({
  jobId: z.string().min(1),
  topK: z.number().int().min(1).max(30),
  durationMinutes: z.number().int().min(15).max(180),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  timezone: z.string().min(2).max(80),
  customMessage: z.string().max(1000).optional(),
  redirectPath: z.string().min(1).optional(),
});

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireAuth();

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      headline: asString(formData.get("headline")),
      summary: asString(formData.get("summary")),
      phone: asString(formData.get("phone")),
      location: asString(formData.get("location")),
      skills: asString(formData.get("skills")),
      experience: asString(formData.get("experience")),
      education: asString(formData.get("education")),
      projects: asString(formData.get("projects")),
      certifications: asString(formData.get("certifications")),
      linkedin: asString(formData.get("linkedin")),
      github: asString(formData.get("github")),
    },
    create: {
      userId: user.id,
      headline: asString(formData.get("headline")),
      summary: asString(formData.get("summary")),
      phone: asString(formData.get("phone")),
      location: asString(formData.get("location")),
      skills: asString(formData.get("skills")),
      experience: asString(formData.get("experience")),
      education: asString(formData.get("education")),
      projects: asString(formData.get("projects")),
      certifications: asString(formData.get("certifications")),
      linkedin: asString(formData.get("linkedin")),
      github: asString(formData.get("github")),
    },
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/applicant");
  redirect("/dashboard/profile?saved=1");
}

export async function generateResumeDraftAction() {
  const user = await requireAuth();

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    redirect("/dashboard/profile");
  }

  const resumeDraft = buildResumeFromProfile({
    user: {
      name: user.name,
      email: user.email,
    },
    profile,
  });

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: { resumeDraft },
  });

  revalidatePath("/dashboard/resume-builder");
  redirect("/dashboard/resume-builder?built=1");
}

export async function saveResumeDraftAction(formData: FormData) {
  const user = await requireAuth();
  const resumeDraft = asString(formData.get("resumeDraft"));

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      resumeDraft,
    },
    create: {
      userId: user.id,
      resumeDraft,
    },
  });

  revalidatePath("/dashboard/resume-builder");
  redirect("/dashboard/resume-builder?saved=1");
}

/**
 * Applicant: Polish Resume Draft via LLM
 */
export async function polishResumeAction(formData: FormData) {
  const user = await requireRole(["APPLICANT"]);
  const draft = formData.get("resumeDraft")?.toString() || "";

  if (!draft.trim()) {
    redirect("/dashboard/resume-builder?error=empty");
  }

  const polished = await polishResumeWithGroq(draft);

  await prisma.userProfile.update({
    where: { userId: user.id },
    data: { resumeDraft: polished },
  });

  redirect("/dashboard/resume-builder?polished=1");
}

/**
 * Applicant: Analyze Fit Before Applying
 */
export async function analyzeFitAction(jobId: string) {
  const user = await requireRole(["APPLICANT"]);
  
  const [job, profile] = await Promise.all([
    prisma.jobPosting.findUnique({ where: { id: jobId } }),
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
  ]);

  if (!job) throw new Error("Job not found");
  if (!profile) throw new Error("Profile not complete. Please complete your profile first.");

  const generatedDraft = buildResumeFromProfile({
    user: { name: user.name, email: user.email },
    profile,
  });
  
  const resumeText = profile.resumeDraft || generatedDraft;
  
  // Use the advanced Groq scorer for the fit analysis
  const requirements = [job.description, job.requirements, job.responsibilities].filter(Boolean).join("\n\n");
  const result = await scoreResumeAgainstRequirements(resumeText, requirements);

  return result;
}

export async function applyToJobAction(formData: FormData) {
  const user = await requireRole([Role.APPLICANT]);

  const jobId = asString(formData.get("jobId"));
  const source = asString(formData.get("source")) || "PASTE";
  const pastedResume = asString(formData.get("resumeText"));
  const resumeFile = formData.get("resumeFile");

  if (!jobId) {
    redirect("/jobs");
  }

  const [job, profile] = await Promise.all([
    prisma.jobPosting.findUnique({ where: { id: jobId } }),
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
  ]);

  if (!job || job.status !== "OPEN") {
    redirect("/jobs");
  }

  const builtResume = profile
    ? buildResumeFromProfile({
        user: { name: user.name, email: user.email },
        profile,
      })
    : "";

  const uploadedResumeText =
    resumeFile instanceof File && resumeFile.size > 0 ? await resumeFile.text() : "";
  const resumeText =
    source === "BUILDER" ? builtResume : uploadedResumeText.trim() || pastedResume;

  if (resumeText.length < 40) {
    redirect(`/jobs/${jobId}?error=resume_too_short`);
  };

  const requirements = [job.description, job.requirements, job.responsibilities].filter(Boolean).join("\n\n");
  const aiScore = await scoreResumeAgainstRequirements(resumeText, requirements);

  await prisma.application.upsert({
    where: {
      jobId_applicantId: {
        jobId,
        applicantId: user.id,
      },
    },
    update: {
      resumeText,
      source,
      aiScore: aiScore.score,
      aiReasoning: aiScore.reasoning,
      status: ApplicationStatus.PENDING,
    },
    create: {
      jobId,
      applicantId: user.id,
      resumeText,
      source,
      aiScore: aiScore.score,
      aiReasoning: aiScore.reasoning,
      status: ApplicationStatus.PENDING,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard/applicant");
  redirect(`/jobs/${jobId}?applied=1&score=${aiScore.score}`);
}

export async function createJobPostingAction(formData: FormData) {
  const user = await requireRole([Role.ADMIN, Role.RECRUITER]);

  const minExperienceRaw = asString(formData.get("minExperience"));
  const input = {
    title: asString(formData.get("title")),
    department: asString(formData.get("department")),
    location: asString(formData.get("location")),
    employmentType: asString(formData.get("employmentType")),
    description: asString(formData.get("description")),
    requirements: asString(formData.get("requirements")),
    responsibilities: asString(formData.get("responsibilities")),
    minExperience: minExperienceRaw ? Number(minExperienceRaw) : undefined,
  };

  const parsed = jobSchema.safeParse(input);

  const redirectPath = asString(formData.get("redirectPath")) || "/dashboard/admin/jobs";

  if (!parsed.success) {
    redirect(`${redirectPath}?job=invalid`);
  }

  await prisma.jobPosting.create({
    data: {
      ...parsed.data,
      postedById: user.id,
      status: "OPEN",
      deadline: asString(formData.get("deadline"))
        ? new Date(asString(formData.get("deadline")))
        : null,
    },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath("/jobs");
  redirect(`${redirectPath}?job=created`);
}

export async function sendTopKInvitesAction(formData: FormData) {
  const user = await requireRole([Role.RECRUITER, Role.ADMIN]);

  const jobId = asString(formData.get("jobId"));
  const redirectPath = asString(formData.get("redirectPath")) || "/dashboard/admin";
  const customMessage = asString(formData.get("customMessage"));
  const topK = Math.max(1, Math.min(50, Number(asString(formData.get("topK")) || 3)));

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    include: {
      applications: {
        where: {
          status: {
            in: [ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED],
          },
        },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          aiScore: "desc",
        },
      },
    },
  });

  if (!job) {
    redirect(redirectPath);
  }

  const selected = job.applications.slice(0, topK);

  let deliveredCount = 0;
  for (const application of selected) {
    if (!application.applicant.email) {
      continue;
    }

    const mailResult = await sendInterviewInvite({
      to: application.applicant.email,
      candidateName: application.applicant.name || "Candidate",
      jobTitle: job.title,
      companyName: "DevSpark",
      message: customMessage,
    });

    if (mailResult.delivered) {
      deliveredCount += 1;
    }

    await prisma.interviewInvite.create({
      data: {
        applicationId: application.id,
        sentById: user.id,
        message: customMessage,
        emailSnapshot: mailResult.note,
      },
    });

    await prisma.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.INVITED },
    });
  }

  revalidatePath("/dashboard/admin");
  redirect(`${redirectPath}?invites=${selected.length}&delivered=${deliveredCount}`);
}

export async function scheduleTopKInterviewsWithMcpAction(formData: FormData) {
  const user = await requireRole([Role.RECRUITER, Role.ADMIN]);

  const redirectPath = asString(formData.get("redirectPath")) || "/dashboard/admin";

  const parsed = scheduleSchema.safeParse({
    jobId: asString(formData.get("jobId")),
    topK: Number(asString(formData.get("topK")) || 3),
    durationMinutes: Number(asString(formData.get("durationMinutes")) || 45),
    startDate: asString(formData.get("startDate")),
    endDate: asString(formData.get("endDate")),
    timezone: "Asia/Dhaka",
    customMessage: asString(formData.get("customMessage")) || undefined,
    redirectPath,
  });

  if (!parsed.success) {
    redirect(`${redirectPath}?scheduled_error=invalid_input`);
  }

  const job = await prisma.jobPosting.findUnique({
    where: { id: parsed.data.jobId },
    include: {
      applications: {
        where: {
          status: {
            in: [
              ApplicationStatus.PENDING,
              ApplicationStatus.SHORTLISTED,
              ApplicationStatus.INVITED,
            ],
          },
        },
        include: {
          applicant: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          aiScore: "desc",
        },
      },
    },
  });

  if (!job) {
    redirect(`${redirectPath}?scheduled_error=job_not_found`);
  }

  const candidates: {
    applicationId: string;
    name: string;
    email: string;
    aiScore: number;
  }[] = [];

  for (const application of job.applications) {
    if (!application.applicant.email) {
      continue;
    }

    candidates.push({
      applicationId: application.id,
      name: application.applicant.name || "Candidate",
      email: application.applicant.email,
      aiScore: application.aiScore,
    });

    if (candidates.length >= parsed.data.topK) {
      break;
    }
  }

  if (!candidates.length) {
    redirect(`${redirectPath}?scheduled_error=no_candidates`);
  }

  const scheduleResult = await scheduleInterviewsWithCopilot({
    companyName: "DevSpark",
    jobTitle: job.title,
    jobId: job.id,
    recruiterName: user.name || "Recruitment Team",
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    timezone: parsed.data.timezone,
    durationMinutes: parsed.data.durationMinutes,
    customMessage: parsed.data.customMessage,
    candidates,
  });

  for (const outcome of scheduleResult.outcomes) {
    const snapshot = [
      `Mode: ${scheduleResult.mode.toUpperCase()}`,
      outcome.emailNote,
      scheduleResult.notes.length
        ? `Notes: ${scheduleResult.notes.join(" | ").slice(0, 1400)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    await prisma.interviewInvite.create({
      data: {
        applicationId: outcome.applicationId,
        sentById: user.id,
        message: parsed.data.customMessage,
        emailSnapshot: snapshot || "Interview scheduling completed.",
        scheduledStart: outcome.scheduledStart,
        scheduledEnd: outcome.scheduledEnd,
        timezone: outcome.timezone,
        meetingUrl: outcome.meetingUrl,
        mcpEventId: outcome.mcpEventId,
        mcpTrace: outcome.mcpTrace || null,
        emailDeliveryStatus: outcome.emailDelivered ? "DELIVERED" : "FAILED",
      },
    });

    await prisma.application.update({
      where: { id: outcome.applicationId },
      data: {
        status: ApplicationStatus.INTERVIEW_SCHEDULED,
      },
    });
  }

  const scheduledCount = scheduleResult.outcomes.length;
  const emailDeliveredCount = scheduleResult.outcomes.filter((item) => item.emailDelivered).length;
  const failedCount = scheduleResult.outcomes.filter((item) => !item.emailDelivered).length;
  const notePreview = scheduleResult.notes[0]?.slice(0, 180);

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/applicant");

  const query = new URLSearchParams({
    scheduled_count: String(scheduledCount),
    scheduled_emails: String(emailDeliveredCount),
    scheduled_failed: String(failedCount),
    scheduled_mode: scheduleResult.mode,
  });

  if (notePreview) {
    query.set("scheduled_note", notePreview);
  }

  redirect(`${redirectPath}?${query.toString()}`);
}



// ─────────────────────────────────────────────────────────────────────────────
// NEW SERVER ACTIONS TO ADD to /app/actions/recruitment.ts
// These actions are called by the new admin dashboard pages.
// Add them alongside your existing actions (createJobPostingAction, etc.)
// ─────────────────────────────────────────────────────────────────────────────


// ─── UPDATE JOB STATUS (Open / Closed / Draft) ───────────────────────────────
export async function updateJobStatusAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const jobId = formData.get("jobId") as string;
  const status = formData.get("status") as JobStatus;
  const redirectPath = (formData.get("redirectPath") as string) || "/dashboard/admin/jobs";

  if (!jobId || !status) redirect(`${redirectPath}?status=invalid`);

  await prisma.jobPosting.update({
    where: { id: jobId },
    data: { status },
  });

  revalidatePath("/dashboard/admin");
  redirect(`${redirectPath}?status=updated`);
}

// ─── UPDATE JOB POSTING (Edit) ────────────────────────────────────────────────
export async function updateJobPostingAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const jobId = formData.get("jobId") as string;
  const redirectPath = (formData.get("redirectPath") as string) || "/dashboard/admin/jobs";

  const title = formData.get("title") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const employmentType = formData.get("employmentType") as string;
  const description = formData.get("description") as string;
  const requirements = formData.get("requirements") as string;
  const responsibilities = formData.get("responsibilities") as string;
  const minExperienceRaw = formData.get("minExperience") as string;
  const deadlineRaw = formData.get("deadline") as string;
  const status = formData.get("status") as JobStatus;

  if (!jobId || !title || !department || !location || !employmentType || !description || !requirements || !responsibilities) {
    redirect(`${redirectPath}?job=invalid`);
  }

  await prisma.jobPosting.update({
    where: { id: jobId },
    data: {
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      employmentType: employmentType.trim(),
      description: description.trim(),
      requirements: requirements.trim(),
      responsibilities: responsibilities.trim(),
      minExperience: minExperienceRaw ? parseInt(minExperienceRaw) : null,
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
      ...(status && { status }),
    },
  });

  revalidatePath("/dashboard/admin");
  redirect(redirectPath);
}

// ─── DELETE JOB POSTING ───────────────────────────────────────────────────────
export async function deleteJobPostingAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const jobId = formData.get("jobId") as string;
  const redirectPath = (formData.get("redirectPath") as string) || "/dashboard/admin/jobs";

  if (!jobId) redirect(redirectPath);

  // Cascades to applications + invites via Prisma schema
  await prisma.jobPosting.delete({ where: { id: jobId } });

  revalidatePath("/dashboard/admin");
  redirect(`${redirectPath}?deleted=1`);
}

// ─── UPDATE APPLICATION STATUS ────────────────────────────────────────────────
export async function updateApplicationStatusAction(formData: FormData) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const applicationId = formData.get("applicationId") as string;
  const status = formData.get("status") as ApplicationStatus;
  const redirectPath = (formData.get("redirectPath") as string) || "/dashboard/admin/applications";

  if (!applicationId || !status) redirect(redirectPath);

  await prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });

  revalidatePath("/dashboard/admin");
  redirect(redirectPath);
}

// ─── UPDATE USER ROLE ─────────────────────────────────────────────────────────
export async function updateUserRoleAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as Role;
  const redirectPath = (formData.get("redirectPath") as string) || "/dashboard/admin/users";

  if (!userId || !role) redirect(redirectPath);

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/dashboard/admin");
  redirect(redirectPath);
}

// ─── DELETE USER ──────────────────────────────────────────────────────────────
export async function deleteUserAction(formData: FormData) {
  await requireRole([Role.ADMIN]);

  const userId = formData.get("userId") as string;
  const redirectPath = (formData.get("redirectPath") as string) || "/dashboard/admin/users";

  if (!userId) redirect(redirectPath);

  // Cascades to profile, applications, invites via schema
  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/dashboard/admin");
  redirect(`${redirectPath}?deleted=1`);
}