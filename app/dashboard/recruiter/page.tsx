import Link from "next/link";
import { Role } from "@prisma/client";

import {
  createJobPostingAction,
  scheduleTopKInterviewsWithMcpAction,
  sendTopKInvitesAction,
} from "@/app/actions/recruitment";
import { formatDate } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RecruiterPageProps = {
  searchParams?: {
    job?: string;
    invites?: string;
    delivered?: string;
    scheduled_count?: string;
    scheduled_emails?: string;
    scheduled_failed?: string;
    scheduled_mode?: string;
    scheduled_note?: string;
    scheduled_error?: string;
  };
};

export default async function RecruiterDashboardPage({ searchParams }: RecruiterPageProps) {
  const user = await requireRole([Role.RECRUITER, Role.ADMIN]);
  const mcpConfigured = Boolean(process.env.MCP_SERVER_URL);

  const now = new Date();
  const defaultStartDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const defaultEndDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const defaultTimezone = process.env.MCP_DEFAULT_TIMEZONE || "Asia/Dhaka";

  const whereClause = user.role === Role.ADMIN ? {} : { postedById: user.id };

  const [jobs, applicantCount, openCircularCount] = await Promise.all([
    prisma.jobPosting.findMany({
      where: whereClause,
      include: {
        applications: {
          include: {
            applicant: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { aiScore: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: Role.APPLICANT } }),
    prisma.jobPosting.count({ where: { status: "OPEN", ...whereClause } }),
  ]);

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-slate-900">
          {user.role === Role.ADMIN ? "Recruitment Operations" : "Recruiter Dashboard"}
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          Publish circulars, monitor AI scores, and send top-k interview invitations.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Open circulars</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{openCircularCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total applicants</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{applicantCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Applications received</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {jobs.reduce((total, job) => total + job.applications.length, 0)}
            </p>
          </div>
        </div>

        {searchParams?.job === "created" ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            New circular published successfully.
          </p>
        ) : null}
        {searchParams?.job === "invalid" ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Please fill all job fields correctly.
          </p>
        ) : null}
        {searchParams?.invites ? (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
            {searchParams.invites} candidate(s) selected, {searchParams.delivered || 0} invitation email(s)
            delivered.
          </p>
        ) : null}
        {searchParams?.scheduled_count ? (
          <p className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
            MCP interview copilot scheduled {searchParams.scheduled_count} interview(s), emailed {searchParams.scheduled_emails || 0}, failed {searchParams.scheduled_failed || 0}.
            {searchParams.scheduled_mode
              ? ` Mode: ${searchParams.scheduled_mode.toUpperCase()}.`
              : ""}
            {searchParams.scheduled_note ? ` Note: ${searchParams.scheduled_note}` : ""}
          </p>
        ) : null}
        {searchParams?.scheduled_error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            MCP scheduling failed: {searchParams.scheduled_error.replaceAll("_", " ")}.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-slate-500">
          MCP status: {mcpConfigured ? "Configured" : "Not configured (feature falls back where possible)"}
        </p>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">Publish new circular</h2>
        <form action={createJobPostingAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <input name="title" className="input-field" placeholder="Position title" required />
          <input name="department" className="input-field" placeholder="Department" required />
          <input name="location" className="input-field" placeholder="Location" required />
          <input name="employmentType" className="input-field" placeholder="Employment type" required />
          <input
            name="minExperience"
            className="input-field"
            placeholder="Minimum experience in years"
            type="number"
            min={0}
          />
          <input name="deadline" className="input-field" type="date" />
          <textarea
            name="description"
            className="text-area md:col-span-2"
            placeholder="Role overview"
            required
          />
          <textarea
            name="requirements"
            className="text-area md:col-span-2"
            placeholder="Required skills and qualifications"
            required
          />
          <textarea
            name="responsibilities"
            className="text-area md:col-span-2"
            placeholder="Key responsibilities"
            required
          />
          <button type="submit" className="btn-main md:col-span-2 md:w-fit">
            Publish circular
          </button>
        </form>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">Manage applications</h2>

        <div className="mt-5 space-y-5">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-amber-200 bg-white/80 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{job.title}</h3>
                  <p className="text-sm text-slate-600">
                    {job.department} · {job.location} · Posted {formatDate(job.createdAt)}
                  </p>
                </div>
                <Link href={`/jobs/${job.id}`} className="btn-soft text-center">
                  Open circular
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-amber-200 text-left text-slate-600">
                      <th className="px-2 py-2">Applicant</th>
                      <th className="px-2 py-2">Email</th>
                      <th className="px-2 py-2">AI score</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.applications.slice(0, 8).map((application) => (
                      <tr key={application.id} className="border-b border-amber-100/70">
                        <td className="px-2 py-2 font-medium text-slate-900">
                          {application.applicant.name || "Applicant"}
                        </td>
                        <td className="px-2 py-2 text-slate-700">{application.applicant.email}</td>
                        <td className="px-2 py-2 text-slate-700">{application.aiScore.toFixed(2)}</td>
                        <td className="px-2 py-2 text-slate-700">{application.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!job.applications.length ? (
                  <p className="mt-3 text-sm text-slate-600">No applications for this circular yet.</p>
                ) : null}
              </div>

              {job.applications.length ? (
                <div className="mt-4 space-y-4">
                  <form action={sendTopKInvitesAction} className="grid gap-3 md:grid-cols-3">
                    <input type="hidden" name="jobId" value={job.id} />
                    <input
                      type="hidden"
                      name="redirectPath"
                      value={user.role === Role.ADMIN ? "/dashboard/admin" : "/dashboard/recruiter"}
                    />
                    <input
                      name="topK"
                      type="number"
                      min={1}
                      max={20}
                      defaultValue={3}
                      className="input-field"
                      placeholder="Top K"
                    />
                    <input
                      name="customMessage"
                      className="input-field md:col-span-2"
                      placeholder="Custom interview message (optional)"
                    />
                    <button type="submit" className="btn-main md:col-span-3 md:w-fit">
                      Select top-k and send invite
                    </button>
                  </form>

                  <form
                    action={scheduleTopKInterviewsWithMcpAction}
                    className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 grid gap-3 md:grid-cols-3"
                  >
                    <input type="hidden" name="jobId" value={job.id} />
                    <input
                      type="hidden"
                      name="redirectPath"
                      value={user.role === Role.ADMIN ? "/dashboard/admin" : "/dashboard/recruiter"}
                    />
                    <input
                      name="topK"
                      type="number"
                      min={1}
                      max={20}
                      defaultValue={3}
                      className="input-field"
                      placeholder="Top K"
                    />
                    <input
                      name="durationMinutes"
                      type="number"
                      min={15}
                      max={180}
                      defaultValue={45}
                      className="input-field"
                      placeholder="Duration (minutes)"
                    />
                    <input
                      name="timezone"
                      defaultValue={defaultTimezone}
                      className="input-field"
                      placeholder="Timezone"
                    />
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={defaultStartDate}
                      className="input-field"
                    />
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={defaultEndDate}
                      className="input-field"
                    />
                    <input
                      name="customMessage"
                      className="input-field md:col-span-1"
                      placeholder="Custom note to candidate"
                    />
                    <button type="submit" className="btn-main md:col-span-3 md:w-fit">
                      AI Interview Scheduling Copilot (MCP Calendar + Gmail)
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ))}

          {!jobs.length ? (
            <p className="text-sm text-slate-600">No circulars published yet.</p>
          ) : null}
        </div>
      </article>
    </div>
  );
}
