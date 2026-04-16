import Link from "next/link";
import { Role } from "@prisma/client";

import { formatDate } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole([Role.ADMIN]);

  const [users, jobs, applications, invites, topApplicants] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.jobPosting.findMany({
      include: {
        postedBy: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.application.count(),
    prisma.interviewInvite.count(),
    prisma.application.findMany({
      include: {
        applicant: {
          select: {
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { aiScore: "desc" },
      take: 6,
    }),
  ]);

  const applicantCount = users.filter((user) => user.role === Role.APPLICANT).length;
  const recruiterCount = users.filter((user) => user.role !== Role.APPLICANT).length;

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-700">
          Monitor company-wide hiring progress and top candidate pipeline.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tracked users</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{users.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Applicants</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{applicantCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Applications</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{applications}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Invites sent</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{invites}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/recruiter" className="btn-main">
            Open recruiter operations
          </Link>
          <Link href="/jobs" className="btn-soft">
            View public circular list
          </Link>
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">Recent users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-left text-slate-600">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-amber-100/70">
                  <td className="px-2 py-2 font-medium text-slate-900">{user.name || "Unnamed"}</td>
                  <td className="px-2 py-2 text-slate-700">{user.email}</td>
                  <td className="px-2 py-2 text-slate-700">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">Circular performance</h2>
        <div className="mt-4 grid gap-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{job.title}</p>
                <p className="text-xs text-slate-600">
                  Posted by {job.postedBy.name || "Recruiter"} on {formatDate(job.createdAt)}
                </p>
              </div>
              <p className="text-sm text-slate-700">{job._count.applications} application(s)</p>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">Top AI-scored applicants</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-left text-slate-600">
                <th className="px-2 py-2">Applicant</th>
                <th className="px-2 py-2">Position</th>
                <th className="px-2 py-2">AI score</th>
              </tr>
            </thead>
            <tbody>
              {topApplicants.map((application) => (
                <tr key={application.id} className="border-b border-amber-100/70">
                  <td className="px-2 py-2 font-medium text-slate-900">
                    {application.applicant.name || application.applicant.email}
                  </td>
                  <td className="px-2 py-2 text-slate-700">{application.job.title}</td>
                  <td className="px-2 py-2 text-slate-700">{application.aiScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <p className="text-xs text-slate-500">Internal recruiters tracked in this view: {recruiterCount}</p>
    </div>
  );
}
