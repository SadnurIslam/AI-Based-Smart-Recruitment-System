import Link from "next/link";

import { formatDate, formatDateTime } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function ApplicantDashboardPage() {
  const user = await requireRole(["APPLICANT"]);

  const [profile, applications, suggestedJobs] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.application.findMany({
      where: { applicantId: user.id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
          },
        },
        invites: {
          where: {
            scheduledStart: {
              not: null,
            },
          },
          orderBy: {
            scheduledStart: "desc",
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.jobPosting.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        location: true,
      },
    }),
  ]);

  const profileFields = [
    profile?.headline,
    profile?.summary,
    profile?.skills,
    profile?.experience,
    profile?.education,
    profile?.phone,
    profile?.location,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter((value) => Boolean(value && value.trim())).length / profileFields.length) *
      100
  );

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-white">Applicant Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Track your application performance and improve profile strength to boost AI matching score.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Profile completion</p>
            <p className="mt-2 text-3xl font-bold text-white">{profileCompletion}%</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total applications</p>
            <p className="mt-2 text-3xl font-bold text-white">{applications.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Highest AI score</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {applications.length
                ? Math.max(...applications.map((item) => item.aiScore)).toFixed(2)
                : "0.00"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/profile" className="btn-main">
            Update profile
          </Link>
          <Link href="/dashboard/resume-builder" className="btn-soft">
            Open AI resume builder
          </Link>
          <Link href="/dashboard/applicant/score-resume" className="btn-soft">
            Score resume
          </Link>
          <Link href="/dashboard/applicant/job-match" className="btn-soft">
            Find matching jobs
          </Link>
          <Link href="/dashboard/applicant/interviews" className="btn-soft">
            My interviews
          </Link>
          <Link href="/dashboard/applicant/applications" className="btn-soft">
            My applications
          </Link>
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-white">Suggested circulars</h2>
        <div className="mt-4 grid gap-3">
          {suggestedJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 transition hover:border-teal-200"
            >
              <span className="font-semibold text-white">{job.title}</span> · {job.location}
            </Link>
          ))}
        </div>
      </article>
    </div>
  );
}
