import Link from "next/link";

import { formatDate } from "@/lib/date";
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
      },
      orderBy: { createdAt: "desc" },
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
        <h1 className="text-3xl font-bold text-slate-900">Applicant Dashboard</h1>
        <p className="mt-2 text-sm text-slate-700">
          Track your application performance and improve profile strength to boost AI matching score.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Profile completion</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{profileCompletion}%</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total applications</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{applications.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Highest AI score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
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
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">My applications</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-left text-slate-600">
                <th className="px-2 py-2">Position</th>
                <th className="px-2 py-2">Department</th>
                <th className="px-2 py-2">AI score</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Applied on</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-b border-amber-100/70">
                  <td className="px-2 py-2 font-medium text-slate-900">{application.job.title}</td>
                  <td className="px-2 py-2 text-slate-700">{application.job.department}</td>
                  <td className="px-2 py-2 text-slate-700">{application.aiScore.toFixed(2)}</td>
                  <td className="px-2 py-2 text-slate-700">{application.status}</td>
                  <td className="px-2 py-2 text-slate-700">{formatDate(application.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.length ? (
            <p className="mt-4 text-sm text-slate-600">No applications yet. Start with a circular below.</p>
          ) : null}
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">Suggested circulars</h2>
        <div className="mt-4 grid gap-3">
          {suggestedJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-slate-700 transition hover:border-teal-200"
            >
              <span className="font-semibold text-slate-900">{job.title}</span> · {job.location}
            </Link>
          ))}
        </div>
      </article>
    </div>
  );
}
