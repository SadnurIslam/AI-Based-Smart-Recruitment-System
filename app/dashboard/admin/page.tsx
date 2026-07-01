import Link from "next/link";
import { Role } from "@prisma/client";

import { formatDate } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams?: Promise<{
    scheduled_count?: string;
    scheduled_emails?: string;
    scheduled_failed?: string;
    scheduled_mode?: string;
    scheduled_note?: string;
    scheduled_error?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);
  const params = await searchParams;  
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
    // Batched into a single transaction (one pooled connection) so the Supabase
    // pgbouncer pool (connection_limit=5) is not exhausted by parallel queries.
  ] = await prisma.$transaction([
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
            <h1 className="text-3xl font-bold text-white">Admin Overview</h1>
            <p className="mt-1 text-sm text-slate-400">
              Monitor hiring activity, top candidates, and platform health at a glance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/admin/jobs/new" className="btn-main">
              + New Circular
            </Link>
            <Link href="/dashboard/admin/jobs" className="btn-soft">
              All Jobs
            </Link>
          </div>
        </div>

        {/* MCP feedback banners */}
        {params?.scheduled_count && (
          <p className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-400">
            MCP copilot scheduled {params.scheduled_count} interview(s) · emailed{" "}
            {params.scheduled_emails || 0} · failed {params.scheduled_failed || 0}.
            {params.scheduled_mode && ` Mode: ${params.scheduled_mode.toUpperCase()}.`}
            {params.scheduled_note && ` ${params.scheduled_note}`}
          </p>
        )}
        {params?.scheduled_error && (
          <p className="mt-4 rounded-xl border border-rose-900 bg-rose-950 px-3 py-2 text-sm text-rose-400">
            MCP scheduling failed: {params.scheduled_error.replaceAll("_", " ")}.
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
          <div key={kpi.label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-xl font-bold text-white">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/admin/jobs/new"
            className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm transition hover:border-lime-500/50"
          >
            <span className="text-lg">📋</span>
            <span className="font-semibold text-white">Post New Job</span>
            <span className="text-slate-400">Publish a new circular</span>
          </Link>
          <Link
            href="/dashboard/admin/applications"
            className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm transition hover:border-lime-500/50"
          >
            <span className="text-lg">📨</span>
            <span className="font-semibold text-white">Review Applications</span>
            <span className="text-slate-400">Score and shortlist candidates</span>
          </Link>
          <Link
            href="/dashboard/admin/jobs"
            className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm transition hover:border-lime-500/50"
          >
            <span className="text-lg">🗂️</span>
            <span className="font-semibold text-white">Manage Jobs</span>
            <span className="text-slate-400">Edit, close, or delete circulars</span>
          </Link>
          <Link
            href="/dashboard/admin/users"
            className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-sm transition hover:border-lime-500/50"
          >
            <span className="text-lg">👥</span>
            <span className="font-semibold text-white">User Management</span>
            <span className="text-slate-400">View and manage all users</span>
          </Link>
        </div>
      </article>

      {/* Top AI-scored applicants */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Top AI-Scored Applicants</h2>
          <Link href="/dashboard/admin/applications" className="text-sm text-lime-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Position</th>
                <th className="px-3 py-2">AI Score</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {topApplicants.map((app) => (
                <tr key={app.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="px-3 py-2 font-medium text-white">
                    {app.applicant.name || "Unnamed"}
                  </td>
                  <td className="px-3 py-2 text-slate-400">{app.applicant.email}</td>
                  <td className="px-3 py-2 text-slate-400">{app.job.title}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        app.aiScore >= 75
                          ? "bg-emerald-500/20 text-emerald-400"
                          : app.aiScore >= 50
                          ? "bg-slate-800 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {app.aiScore.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-block rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
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
          <h2 className="text-xl font-bold text-white">Recent Users</h2>
          <Link href="/dashboard/admin/users" className="text-sm text-lime-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                  <td className="px-3 py-2 font-medium text-white">{u.name || "Unnamed"}</td>
                  <td className="px-3 py-2 text-slate-400">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === Role.ADMIN
                          ? "bg-lime-500/20 text-lime-400"
                          : "bg-teal-500/20 text-teal-400"
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
