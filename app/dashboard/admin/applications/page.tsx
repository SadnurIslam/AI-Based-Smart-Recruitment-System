import Link from "next/link";
import { Role } from "@prisma/client";

import {
  scheduleTopKInterviewsWithMcpAction,
  sendTopKInvitesAction,
  updateApplicationStatusAction,
} from "@/app/actions/recruitment";
import { formatDate, formatDateTime } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ApplicationsPageProps = {
  searchParams?: Promise<{
    jobId?: string;
    invites?: string;
    delivered?: string;
    scheduled_count?: string;
    scheduled_emails?: string;
    scheduled_failed?: string;
    scheduled_mode?: string;
    scheduled_note?: string;
    scheduled_error?: string;
  }>;
};

export default async function AdminApplicationsPage({ searchParams }: ApplicationsPageProps) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const sp = await searchParams;
  const selectedJobId = sp?.jobId;

  const mcpConfigured = Boolean(process.env.MCP_SERVER_URL);
  const now = new Date();
  const defaultStartDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultEndDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const defaultTimezone = process.env.MCP_DEFAULT_TIMEZONE || "Asia/Dhaka";

  const jobs = await prisma.jobPosting.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const selectedJob = selectedJobId ? jobs.find((j) => j.id === selectedJobId) : null;

  // Only fetch applications when a job is selected
  const applications = selectedJobId
    ? await prisma.application.findMany({
        where: { jobId: selectedJobId },
        include: {
          applicant: { select: { name: true, email: true } },
          invites: {
            orderBy: { sentAt: "desc" },
            take: 1,
          },
        },
        orderBy: { aiScore: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <p className="mt-1 text-sm text-slate-400">
          Select a job circular to review its applicants, sorted by AI score.
          {!mcpConfigured && (
            <span className="ml-2 text-amber-600">
              MCP not configured — calendar scheduling unavailable.
            </span>
          )}
        </p>

        {sp?.invites && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-500/10 px-3 py-2 text-sm text-lime-400">
            ✓ Top {sp.invites} candidate(s) selected · {sp.delivered || 0} invitation(s) delivered.
          </p>
        )}
        {sp?.scheduled_count && (
          <p className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-400">
            MCP copilot scheduled {sp.scheduled_count} interview(s) · emailed{" "}
            {sp.scheduled_emails || 0} · failed {sp.scheduled_failed || 0}.
            {sp.scheduled_mode && ` Mode: ${sp.scheduled_mode.toUpperCase()}.`}
            {sp.scheduled_note && ` ${sp.scheduled_note}`}
          </p>
        )}
        {sp?.scheduled_error && (
          <p className="mt-4 rounded-xl border border-rose-900 bg-rose-950 px-3 py-2 text-sm text-rose-400">
            MCP scheduling failed: {sp.scheduled_error.replaceAll("_", " ")}.
          </p>
        )}
      </article>

      {/* Job selector */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-lg font-bold text-white">Select a Circular</h2>
        <p className="mt-1 text-sm text-slate-500">Click a job to view its applicants.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/admin/applications?jobId=${job.id}`}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                selectedJobId === job.id
                  ? "border-lime-500 bg-teal-500/10 shadow-sm"
                  : "border-slate-800 bg-slate-900/50 hover:border-lime-500/50"
              }`}
            >
              <div>
                <p className="font-semibold text-white">{job.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium mr-2 ${
                      job.status === "OPEN"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {job.status}
                  </span>
                  {job._count.applications} applicant(s)
                </p>
              </div>
              {selectedJobId === job.id && (
                <span className="text-lime-400 text-xs font-semibold">Viewing →</span>
              )}
            </Link>
          ))}
          {!jobs.length && (
            <p className="text-sm text-slate-500">No circulars found.</p>
          )}
        </div>
      </article>

      {/* Only show below sections when a job is selected */}
      {selectedJob && (
        <>
          {/* Top-K invite panel */}
          <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
            <h2 className="text-lg font-bold text-white">
              Send Interview Invites — {selectedJob.title}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Top-K is picked by highest AI score. Only candidates with status{" "}
              <span className="font-medium">Pending</span> or{" "}
              <span className="font-medium">Shortlisted</span> are eligible.
            </p>

            <div className="mt-5 space-y-4">
              {/* Email invite */}
              <div className="rounded-2xl border border-teal-200 bg-teal-500/10/40 p-4">
                <p className="text-sm font-semibold text-slate-300 mb-3">📧 Email Invite</p>
                <form action={sendTopKInvitesAction} className="grid gap-3 md:grid-cols-3">
                  <input type="hidden" name="jobId" value={selectedJob.id} />
                  <input type="hidden" name="redirectPath" value={`/dashboard/admin/applications?jobId=${selectedJob.id}`} />
                  <input
                    name="topK"
                    type="number"
                    min={1}
                    max={applications.length || 1}
                    defaultValue={Math.min(3, applications.length || 1)}
                    className="input-field"
                    placeholder="Top K (e.g. 3)"
                  />
                  <input
                    name="customMessage"
                    className="input-field md:col-span-2"
                    placeholder="Custom message to candidates (optional)"
                  />
                  <button type="submit" className="btn-main md:col-span-3 md:w-fit">
                    Send Invite to Top-K Candidates
                  </button>
                </form>
              </div>

              {/* MCP scheduling */}
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10/40 p-4">
                <p className="text-sm font-semibold text-slate-300 mb-1">
                  🤖 AI Interview Scheduling Copilot
                  {!mcpConfigured && (
                    <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-amber-400">
                      MCP not configured
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mb-3">
                  Automatically schedule interviews via Google Calendar + Gmail.
                </p>
                <form action={scheduleTopKInterviewsWithMcpAction} className="grid gap-3 md:grid-cols-3">
                  <input type="hidden" name="jobId" value={selectedJob.id} />
                  <input type="hidden" name="redirectPath" value={`/dashboard/admin/applications?jobId=${selectedJob.id}`} />
                  <input name="topK" type="number" min={1} max={20} defaultValue={3} className="input-field" placeholder="Top K" />
                  <input name="durationMinutes" type="number" min={15} max={180} defaultValue={45} className="input-field" placeholder="Duration (min)" />
                  <input name="timezone" defaultValue={defaultTimezone} className="input-field" placeholder="Timezone" />
                  <input type="date" name="startDate" defaultValue={defaultStartDate} className="input-field" />
                  <input type="date" name="endDate" defaultValue={defaultEndDate} className="input-field" />
                  <input name="customMessage" className="input-field" placeholder="Note to candidates (optional)" />
                  <button type="submit" className="btn-main md:col-span-3 md:w-fit">
                    Schedule with MCP Copilot (Calendar + Gmail)
                  </button>
                </form>
              </div>
            </div>
          </article>

          {/* Applicants table for selected job */}
          <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedJob.title}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {applications.length} applicant(s) · sorted by AI score (highest first)
                </p>
              </div>
              <Link
                href="/dashboard/admin/applications"
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                ← Back to all jobs
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Applicant</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">AI Score</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Interview</th>
                    <th className="px-3 py-2">Applied</th>
                    <th className="px-3 py-2">Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, index) => {
                    const latestInvite = app.invites[0];
                    return (
                      <tr
                        key={app.id}
                        className={`border-b border-slate-800 hover:bg-slate-800/50 transition ${
                          index === 0 ? "bg-emerald-50/30" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400 text-xs font-medium">
                          {index + 1}
                          {index === 0 && (
                            <span className="ml-1 text-emerald-600">★</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-white">
                          {app.applicant.name || "Unnamed"}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{app.applicant.email}</td>
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
                            {app.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-xs">
                          {latestInvite?.scheduledStart
                            ? formatDateTime(latestInvite.scheduledStart, latestInvite.timezone || undefined)
                            : latestInvite
                            ? "Invited"
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-xs">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <form action={updateApplicationStatusAction} className="flex items-center gap-1">
                            <input type="hidden" name="applicationId" value={app.id} />
                            <input type="hidden" name="redirectPath" value={`/dashboard/admin/applications?jobId=${selectedJob.id}`} />
                            <select
                              name="status"
                              defaultValue={app.status}
                              className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none focus:border-lime-400"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="SHORTLISTED">Shortlisted</option>
                              <option value="INVITED">Invited</option>
                              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                            <button
                              type="submit"
                              className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-200 transition"
                            >
                              Set
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!applications.length && (
                <p className="mt-4 text-sm text-slate-500">
                  No applications for this circular yet.
                </p>
              )}
            </div>
          </article>
        </>
      )}

      {/* Prompt to select a job if none selected */}
      {!selectedJob && (
        <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up text-center">
          <p className="text-4xl mb-3">👆</p>
          <p className="text-slate-400 text-sm">Select a circular above to view its applicants.</p>
        </article>
      )}
    </div>
  );
}
