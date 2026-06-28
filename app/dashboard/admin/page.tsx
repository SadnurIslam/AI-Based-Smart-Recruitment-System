import Link from "next/link";
import { Role } from "@prisma/client";

import { formatDate } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams?: {
    scheduled_count?: string;
    scheduled_emails?: string;
    scheduled_failed?: string;
    scheduled_mode?: string;
    scheduled_note?: string;
    scheduled_error?: string;
  };
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireRole([Role.ADMIN]);

  const [
    totalUsers,
    applicantCount,
    totalJobs,
    openJobCount,
    applicationCount,
    inviteCount,
    scheduledCount,
    recentUsers,
    topApplicants,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: Role.APPLICANT } }),
    prisma.jobPosting.count(),
    prisma.jobPosting.count({ where: { status: "OPEN" } }),
    prisma.application.count(),
    prisma.interviewInvite.count(),
    prisma.interviewInvite.count({ where: { scheduledStart: { not: null } } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.application.findMany({
      include: {
        applicant: { select: { name: true, email: true } },
        job: { select: { title: true } },
      },
      orderBy: { aiScore: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
            <p className="mt-1 text-sm text-slate-600">
              Monitor hiring activity, top candidates, and platform health at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/jobs" className="btn-main">
              + New Circular
            </Link>
            <Link href="/dashboard/admin/jobs" className="btn-soft">
              All Jobs
            </Link>
          </div>
        </div>

        {/* MCP feedback banners */}
        {searchParams?.scheduled_count && (
          <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            MCP copilot scheduled {searchParams.scheduled_count} interview(s) · emailed{" "}
            {searchParams.scheduled_emails || 0} · failed {searchParams.scheduled_failed || 0}.
            {searchParams.scheduled_mode && ` Mode: ${searchParams.scheduled_mode.toUpperCase()}.`}
            {searchParams.scheduled_note && ` ${searchParams.scheduled_note}`}
          </p>
        )}
        {searchParams?.scheduled_error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            MCP scheduling failed: {searchParams.scheduled_error.replaceAll("_", " ")}.
          </p>
        )}
      </article>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 fade-up">
        {[
          { label: "Total Users", value: totalUsers },
          { label: "Applicants", value: applicantCount },
          { label: "Open Jobs", value: openJobCount },
          { label: "Total Jobs", value: totalJobs },
          { label: "Applications", value: applicationCount },
          { label: "Invites Sent", value: inviteCount },
          { label: "Interviews Scheduled", value: scheduledCount },
          { label: "Pending Review", value: applicationCount - inviteCount > 0 ? applicationCount - inviteCount : 0 },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/admin/jobs/new"
            className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-white/80 p-4 text-sm transition hover:border-teal-300"
          >
            <span className="text-lg">📋</span>
            <span className="font-semibold text-slate-900">Post New Job</span>
            <span className="text-slate-500">Publish a new circular</span>
          </Link>
          <Link
            href="/dashboard/admin/applications"
            className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-white/80 p-4 text-sm transition hover:border-teal-300"
          >
            <span className="text-lg">📨</span>
            <span className="font-semibold text-slate-900">Review Applications</span>
            <span className="text-slate-500">Score and shortlist candidates</span>
          </Link>
          <Link
            href="/dashboard/admin/jobs"
            className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-white/80 p-4 text-sm transition hover:border-teal-300"
          >
            <span className="text-lg">🗂️</span>
            <span className="font-semibold text-slate-900">Manage Jobs</span>
            <span className="text-slate-500">Edit, close, or delete circulars</span>
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="flex flex-col gap-1 rounded-2xl border border-amber-200 bg-white/80 p-4 text-sm transition hover:border-teal-300"
          >
            <span className="text-lg">👥</span>
            <span className="font-semibold text-slate-900">User Management</span>
            <span className="text-slate-500">View and manage all users</span>
          </Link>
        </div>
      </article>

      {/* Top AI-scored applicants */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Top AI-Scored Applicants</h2>
          <Link href="/dashboard/admin/applications" className="text-sm text-teal-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Position</th>
                <th className="px-3 py-2">AI Score</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {topApplicants.map((app) => (
                <tr key={app.id} className="border-b border-amber-100/70 hover:bg-amber-50/40 transition">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {app.applicant.name || "Unnamed"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{app.applicant.email}</td>
                  <td className="px-3 py-2 text-slate-700">{app.job.title}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        app.aiScore >= 0.75
                          ? "bg-emerald-100 text-emerald-700"
                          : app.aiScore >= 0.5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {app.aiScore.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!topApplicants.length && (
            <p className="mt-4 text-sm text-slate-500">No applications yet.</p>
          )}
        </div>
      </article>

      {/* Recent users */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recent Users</h2>
          <Link href="/dashboard/admin/users" className="text-sm text-teal-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-amber-100/70 hover:bg-amber-50/40 transition">
                  <td className="px-3 py-2 font-medium text-slate-900">{u.name || "Unnamed"}</td>
                  <td className="px-3 py-2 text-slate-600">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === Role.ADMIN
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
