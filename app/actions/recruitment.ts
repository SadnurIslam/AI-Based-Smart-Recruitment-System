"use server";

import { ApplicationStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth, requireRole } from "@/lib/guards";
import { sendInterviewInvite } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { buildResumeFromProfile } from "@/lib/resume-builder";
import { scoreResumeAgainstRequirements } from "@/lib/ai-scoring";

const jobSchema = z.object({
  title: z.string().min(3),
  department: z.string().min(2),
  location: z.string().min(2),
  employmentType: z.string().min(2),
  description: z.string().min(30),
  requirements: z.string().min(30),
  responsibilities: z.string().min(20),
  minExperience: z.number().int().min(0).max(20).optional(),
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
  }

  const scoreResult = scoreResumeAgainstRequirements(
    resumeText,
    `${job.requirements}\n${job.description}`
  );

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
      aiScore: scoreResult.score,
      aiReasoning: scoreResult.reasoning,
      status: ApplicationStatus.PENDING,
    },
    create: {
      jobId,
      applicantId: user.id,
      resumeText,
      source,
      aiScore: scoreResult.score,
      aiReasoning: scoreResult.reasoning,
      status: ApplicationStatus.PENDING,
    },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard/applicant");
  redirect(`/jobs/${jobId}?applied=1&score=${scoreResult.score}`);
}

export async function createJobPostingAction(formData: FormData) {
  const user = await requireRole([Role.RECRUITER, Role.ADMIN]);

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

  if (!parsed.success) {
    redirect("/dashboard/recruiter?job=invalid");
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

  revalidatePath("/dashboard/recruiter");
  revalidatePath("/jobs");

  if (user.role === Role.ADMIN) {
    redirect("/dashboard/admin?job=created");
  }

  redirect("/dashboard/recruiter?job=created");
}

export async function sendTopKInvitesAction(formData: FormData) {
  const user = await requireRole([Role.RECRUITER, Role.ADMIN]);

  const jobId = asString(formData.get("jobId"));
  const redirectPath = asString(formData.get("redirectPath")) || "/dashboard/recruiter";
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

  revalidatePath("/dashboard/recruiter");
  revalidatePath("/dashboard/admin");
  redirect(`${redirectPath}?invites=${selected.length}&delivered=${deliveredCount}`);
}
