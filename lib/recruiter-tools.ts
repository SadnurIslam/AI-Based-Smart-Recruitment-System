// ─────────────────────────────────────────────────────────────────────────────
// Shared recruiter "tool" core.
//
// Pure async functions that wrap Prisma + the scorers + the resume builder.
// This module MUST stay free of any `next/*` import (no redirect, no next-auth)
// so it can be imported by THREE different consumers:
//   1. the standalone MCP server  (mcp-server/* run via tsx / Claude Desktop)
//   2. the in-app AI copilot       (app/api/copilot/route.ts, Groq tool-calling)
//   3. the HTTP MCP transport      (app/api/mcp/route.ts)
//
// Imports use RELATIVE paths (not the `@/` alias) so that `tsx` — which does not
// resolve tsconfig path aliases — can run the stdio MCP server.
// ─────────────────────────────────────────────────────────────────────────────

import { ApplicationStatus, Role } from "@prisma/client";

import { prisma } from "./prisma";
import { buildResumeFromProfile } from "./resume-builder";
import { sendInterviewInvite } from "./mailer";
//  - Groq = LLM scorer (default)
import { scoreResumeAgainstRequirements as scoreWithGroq } from "./ai-scoring";

export type ScoreDetails = {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
  engine: "nlp" | "groq";
};

function requirementsText(job: { requirements: string; description: string }) {
  return `${job.requirements}\n${job.description}`;
}

// ─── score_resume ────────────────────────────────────────────────────────────
export async function scoreResume(input: {
  resumeText: string;
  jobId?: string;
  requirementsText?: string;
  useGroq?: boolean;
}): Promise<ScoreDetails> {
  let requirements = input.requirementsText?.trim() ?? "";

  if (!requirements && input.jobId) {
    const job = await prisma.jobPosting.findUnique({ where: { id: input.jobId } });
    if (job) {
      requirements = requirementsText(job);
    }
  }

  if (!requirements) {
    throw new Error("Provide either requirementsText or a valid jobId to score against.");
  }

  const groq = await scoreWithGroq(input.resumeText, requirements);
  return { ...groq, engine: "groq" };
}

// ─── list_open_jobs ──────────────────────────────────────────────────────────
export async function listOpenJobs(input: { limit?: number } = {}) {
  const jobs = await prisma.jobPosting.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: input.limit ?? 20,
    select: {
      id: true,
      title: true,
      department: true,
      location: true,
      employmentType: true,
      minExperience: true,
      requirements: true,
      _count: { select: { applications: true } },
    },
  });

  return {
    count: jobs.length,
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      department: j.department,
      location: j.location,
      employmentType: j.employmentType,
      minExperience: j.minExperience,
      requirements: j.requirements,
      applicantCount: j._count.applications,
    })),
  };
}

// ─── shortlist_candidates ────────────────────────────────────────────────────
export async function shortlistCandidates(input: {
  jobId: string;
  topK: number;
  rescore?: boolean;
}) {
  const job = await prisma.jobPosting.findUnique({ where: { id: input.jobId } });
  if (!job) {
    throw new Error(`Job ${input.jobId} not found.`);
  }

  const applications = await prisma.application.findMany({
    where: {
      jobId: input.jobId,
      status: { in: [ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED] },
    },
    include: { applicant: { select: { name: true, email: true } } },
    orderBy: { aiScore: "desc" },
  });

  const candidates = [];
  for (const app of applications) {
    let score = app.aiScore;
    let reasoning = app.aiReasoning ?? "";

    // Re-score with the Groq AI scorer when asked, or when never scored.
    if (input.rescore || score === 0) {
      const fresh = await scoreWithGroq(app.resumeText, requirementsText(job));
      score = fresh.score;
      reasoning = fresh.reasoning;
      await prisma.application.update({
        where: { id: app.id },
        data: { aiScore: score, aiReasoning: reasoning },
      });
    }

    candidates.push({
      applicationId: app.id,
      name: app.applicant.name ?? "Candidate",
      email: app.applicant.email,
      aiScore: Math.round(score * 100) / 100,
      reasoning,
      status: app.status,
    });
  }

  candidates.sort((a, b) => b.aiScore - a.aiScore);

  return {
    jobId: input.jobId,
    jobTitle: job.title,
    totalPool: candidates.length,
    candidates: candidates.slice(0, input.topK),
  };
}

// ─── find_matching_jobs ──────────────────────────────────────────────────────
export async function findMatchingJobs(input: {
  applicantId?: string;
  resumeText?: string;
  topK?: number;
}) {
  let resume = input.resumeText?.trim() ?? "";

  if (!resume && input.applicantId) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: input.applicantId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (profile) {
      resume = buildResumeFromProfile({
        user: { name: profile.user.name, email: profile.user.email },
        profile,
      });
    }
  }

  if (!resume) {
    throw new Error("Provide either resumeText or a valid applicantId.");
  }

  const jobs = await prisma.jobPosting.findMany({ where: { status: "OPEN" } });

  const scoredJobs = [];
  for (const job of jobs) {
    const result = await scoreWithGroq(resume, requirementsText(job));
    scoredJobs.push({
      jobId: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      score: result.score,
      matchedKeywords: result.matchedKeywords.slice(0, 8),
    });
  }

  const matches = scoredJobs
    .sort((a, b) => b.score - a.score)
    .slice(0, input.topK ?? 5);

  return { count: matches.length, matches };
}

// ─── build_resume ────────────────────────────────────────────────────────────
export async function buildResumeForUser(input: { userId: string; polish?: boolean }) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: input.userId },
    include: { user: { select: { name: true, email: true } } },
  });

  if (!profile) {
    throw new Error("No profile found for this user. Ask them to complete their profile first.");
  }

  const markdown = buildResumeFromProfile({
    user: { name: profile.user.name, email: profile.user.email },
    profile,
  });

  // `polish` is reserved for an opt-in Groq prose pass; kept off by default to
  // stay within the free Groq rate limit. The deterministic resume is returned.
  return { userId: input.userId, markdown, polished: false };
}

// ─── get_application_stats ───────────────────────────────────────────────────
export async function getApplicationStats(input: { jobId?: string } = {}) {
  const jobFilter = input.jobId ? { jobId: input.jobId } : {};

  const [totalUsers, applicantCount, openJobs, totalJobs, applications, invites, scheduled] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.APPLICANT } }),
      prisma.jobPosting.count({ where: { status: "OPEN" } }),
      prisma.jobPosting.count(),
      prisma.application.count({ where: jobFilter }),
      prisma.interviewInvite.count(
        input.jobId ? { where: { application: { jobId: input.jobId } } } : undefined
      ),
      prisma.interviewInvite.count({
        where: {
          scheduledStart: { not: null },
          ...(input.jobId ? { application: { jobId: input.jobId } } : {}),
        },
      }),
    ]);

  return {
    scope: input.jobId ? `job:${input.jobId}` : "platform",
    stats: {
      totalUsers,
      applicantCount,
      openJobs,
      totalJobs,
      applications,
      invitesSent: invites,
      interviewsScheduled: scheduled,
    },
  };
}

// ─── schedule_interview ──────────────────────────────────────────────────────
// NOTE: this calls the mailer + Prisma directly. It must NOT call
// scheduleInterviewsWithCopilot, which routes back through the MCP client and
// would recurse into this same server.
export async function scheduleInterview(input: {
  applicationId: string;
  start: string;
  end: string;
  timezone: string;
  sentById: string;
  customMessage?: string;
}) {
  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    include: {
      applicant: { select: { name: true, email: true } },
      job: { select: { title: true } },
    },
  });

  if (!application) {
    throw new Error(`Application ${input.applicationId} not found.`);
  }
  if (!application.applicant.email) {
    throw new Error("Candidate has no email on file.");
  }

  const start = new Date(input.start);
  const end = new Date(input.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("start and end must be valid ISO date strings.");
  }

  const mail = await sendInterviewInvite({
    to: application.applicant.email,
    candidateName: application.applicant.name ?? "Candidate",
    jobTitle: application.job.title,
    companyName: "DevSpark",
    message:
      input.customMessage ??
      `Your interview is scheduled for ${start.toLocaleString("en-US", {
        timeZone: input.timezone,
      })}.`,
  });

  await prisma.interviewInvite.create({
    data: {
      applicationId: application.id,
      sentById: input.sentById,
      message: input.customMessage ?? null,
      emailSnapshot: mail.note,
      scheduledStart: start,
      scheduledEnd: end,
      timezone: input.timezone,
      emailDeliveryStatus: mail.delivered ? "DELIVERED" : "SIMULATED",
    },
  });

  await prisma.application.update({
    where: { id: application.id },
    data: { status: ApplicationStatus.INTERVIEW_SCHEDULED },
  });

  return {
    applicationId: application.id,
    candidate: application.applicant.name,
    scheduledStart: start.toISOString(),
    scheduledEnd: end.toISOString(),
    timezone: input.timezone,
    emailDelivered: mail.delivered,
    note: mail.note,
  };
}

// ─── bulk_shortlist ──────────────────────────────────────────────────────────
// Promote the top-K candidates for a job from PENDING → SHORTLISTED, ranked by
// AI score. Optionally rescore unscored applications first.
export async function bulkShortlist(input: {
  jobId: string;
  topK: number;
  minScore?: number;
  rescore?: boolean;
}) {
  const job = await prisma.jobPosting.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error(`Job ${input.jobId} not found.`);

  const applications = await prisma.application.findMany({
    where: {
      jobId: input.jobId,
      status: ApplicationStatus.PENDING,
    },
    include: { applicant: { select: { name: true, email: true } } },
    orderBy: { aiScore: "desc" },
  });

  // Optionally rescore unscored (aiScore === 0) applications.
  if (input.rescore) {
    for (const app of applications) {
      if (app.aiScore === 0 && app.resumeText.length >= 40) {
        const fresh = await scoreWithGroq(app.resumeText, requirementsText(job));
        app.aiScore = fresh.score;
        await prisma.application.update({
          where: { id: app.id },
          data: { aiScore: fresh.score, aiReasoning: fresh.reasoning },
        });
      }
    }
    // Re-sort after rescoring.
    applications.sort((a, b) => b.aiScore - a.aiScore);
  }

  const minScore = input.minScore ?? 0;
  const eligible = applications.filter((app) => app.aiScore >= minScore);
  const toShortlist = eligible.slice(0, input.topK);

  const shortlisted: { applicationId: string; name: string; email: string; aiScore: number }[] = [];
  const skipped: { applicationId: string; name: string; aiScore: number; reason: string }[] = [];

  for (const app of toShortlist) {
    await prisma.application.update({
      where: { id: app.id },
      data: { status: ApplicationStatus.SHORTLISTED },
    });
    shortlisted.push({
      applicationId: app.id,
      name: app.applicant.name ?? "Candidate",
      email: app.applicant.email,
      aiScore: Math.round(app.aiScore * 100) / 100,
    });
  }

  // Report candidates that were skipped (below minScore or beyond topK).
  for (const app of applications) {
    if (!toShortlist.includes(app)) {
      skipped.push({
        applicationId: app.id,
        name: app.applicant.name ?? "Candidate",
        aiScore: Math.round(app.aiScore * 100) / 100,
        reason: app.aiScore < minScore ? `Below minimum score (${minScore})` : "Beyond top-K cutoff",
      });
    }
  }

  return {
    jobId: input.jobId,
    jobTitle: job.title,
    shortlistedCount: shortlisted.length,
    skippedCount: skipped.length,
    shortlisted,
    skipped,
  };
}

// ─── reject_candidates ───────────────────────────────────────────────────────
// Reject candidates below a score threshold and optionally send them a
// professional rejection email.
export async function rejectCandidates(input: {
  jobId: string;
  belowScore: number;
  sendEmail?: boolean;
  emailMessage?: string;
}) {
  const job = await prisma.jobPosting.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error(`Job ${input.jobId} not found.`);

  const applications = await prisma.application.findMany({
    where: {
      jobId: input.jobId,
      status: { in: [ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED] },
      aiScore: { lt: input.belowScore },
    },
    include: { applicant: { select: { name: true, email: true } } },
  });

  if (!applications.length) {
    return {
      jobId: input.jobId,
      jobTitle: job.title,
      rejectedCount: 0,
      emailedCount: 0,
      rejected: [],
      note: `No candidates found with score below ${input.belowScore}.`,
    };
  }

  const rejected: { applicationId: string; name: string; aiScore: number; emailed: boolean }[] = [];
  let emailedCount = 0;

  for (const app of applications) {
    await prisma.application.update({
      where: { id: app.id },
      data: { status: ApplicationStatus.REJECTED },
    });

    let emailed = false;
    if (input.sendEmail && app.applicant.email) {
      const message =
        input.emailMessage ??
        `Thank you for your interest in the ${job.title} position. After careful review, we have decided to move forward with other candidates whose qualifications more closely match our current needs. We encourage you to apply for future openings.`;

      const mailResult = await sendInterviewInvite({
        to: app.applicant.email,
        candidateName: app.applicant.name ?? "Candidate",
        jobTitle: job.title,
        companyName: "DevSpark",
        message,
      });
      emailed = mailResult.delivered;
      if (emailed) emailedCount++;
    }

    rejected.push({
      applicationId: app.id,
      name: app.applicant.name ?? "Candidate",
      aiScore: Math.round(app.aiScore * 100) / 100,
      emailed,
    });
  }

  return {
    jobId: input.jobId,
    jobTitle: job.title,
    rejectedCount: rejected.length,
    emailedCount,
    rejected,
  };
}

// ─── send_bulk_invites ───────────────────────────────────────────────────────
// Send interview invitation emails to all SHORTLISTED candidates for a job and
// update their status to INVITED. Creates InterviewInvite records.
export async function sendBulkInvites(input: {
  jobId: string;
  sentById: string;
  customMessage?: string;
  startDate?: string;
  durationMinutes?: number;
  gapMinutes?: number;
  timezone?: string;
}) {
  const job = await prisma.jobPosting.findUnique({ where: { id: input.jobId } });
  if (!job) throw new Error(`Job ${input.jobId} not found.`);

  const applications = await prisma.application.findMany({
    where: {
      jobId: input.jobId,
      status: ApplicationStatus.SHORTLISTED,
    },
    include: { applicant: { select: { name: true, email: true } } },
    orderBy: { aiScore: "desc" },
  });

  if (!applications.length) {
    return {
      jobId: input.jobId,
      jobTitle: job.title,
      sentCount: 0,
      failedCount: 0,
      sent: [],
      failed: [],
      note: "No SHORTLISTED candidates found for this job. Run bulk_shortlist first.",
    };
  }

  const sent: { applicationId: string; name: string; email: string }[] = [];
  const failed: { applicationId: string; name: string; reason: string }[] = [];

  let baseTime = input.startDate ? new Date(input.startDate) : null;
  const duration = input.durationMinutes ?? 45;
  const gap = input.gapMinutes ?? 15;
  const tz = input.timezone ?? "Asia/Dhaka";

  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    if (!app.applicant.email) {
      failed.push({
        applicationId: app.id,
        name: app.applicant.name ?? "Candidate",
        reason: "No email on file",
      });
      continue;
    }

    let scheduledStart: Date | null = null;
    let scheduledEnd: Date | null = null;
    let timeSlotMessage = "";

    if (baseTime && !Number.isNaN(baseTime.getTime())) {
      scheduledStart = new Date(baseTime.getTime() + i * (duration + gap) * 60_000);
      scheduledEnd = new Date(scheduledStart.getTime() + duration * 60_000);

      const formatOpts: Intl.DateTimeFormatOptions = { dateStyle: "full", timeStyle: "short", timeZone: tz };
      timeSlotMessage = `\n\nInterview Schedule: ${scheduledStart.toLocaleString("en-US", formatOpts)} - ${scheduledEnd.toLocaleString("en-US", formatOpts)} (${tz})`;
    }

    const finalMessage = (input.customMessage ?? "") + timeSlotMessage;

    const mailResult = await sendInterviewInvite({
      to: app.applicant.email,
      candidateName: app.applicant.name ?? "Candidate",
      jobTitle: job.title,
      companyName: "DevSpark",
      message: finalMessage,
    });

    await prisma.interviewInvite.create({
      data: {
        applicationId: app.id,
        sentById: input.sentById,
        message: finalMessage || null,
        emailSnapshot: mailResult.note,
        scheduledStart,
        scheduledEnd,
        timezone: scheduledStart ? tz : null,
        emailDeliveryStatus: mailResult.delivered ? "DELIVERED" : "SIMULATED",
      },
    });

    await prisma.application.update({
      where: { id: app.id },
      data: { status: ApplicationStatus.INVITED },
    });

    if (mailResult.delivered) {
      sent.push({
        applicationId: app.id,
        name: app.applicant.name ?? "Candidate",
        email: app.applicant.email,
      });
    } else {
      // Email was simulated (no Gmail creds), still mark as sent in results.
      sent.push({
        applicationId: app.id,
        name: app.applicant.name ?? "Candidate",
        email: app.applicant.email,
      });
    }
  }

  return {
    jobId: input.jobId,
    jobTitle: job.title,
    sentCount: sent.length,
    failedCount: failed.length,
    sent,
    failed,
  };
}
