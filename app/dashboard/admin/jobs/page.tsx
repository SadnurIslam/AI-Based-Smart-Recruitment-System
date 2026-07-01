import Link from "next/link";
import { Role } from "@prisma/client";
import { DeleteJobButton } from "@/components/DeleteJobButton";

import {
  deleteJobPostingAction,
  updateJobStatusAction,
} from "@/app/actions/recruitment";
import { formatDate } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type JobsPageProps = {
  searchParams?: Promise<{
    job?: string;
    deleted?: string;
    status?: string;
  }>;
};

export default async function AdminJobsPage({ searchParams }: JobsPageProps) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const params = await searchParams;

  const jobs = await prisma.jobPosting.findMany({
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">All Circulars</h1>
            <p className="mt-1 text-sm text-slate-400">
              Review, edit, close, and delete the published openings.
            </p>
          </div>

          <Link href="/dashboard/admin/jobs/new" className="btn-main w-fit">
            + Post New Circular
          </Link>
        </div>

        {params?.deleted && (
          <p className="mt-4 rounded-xl border border-rose-900 bg-rose-950 px-3 py-2 text-sm text-rose-400">
            Circular deleted.
          </p>
        )}
        {params?.status && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-500/10 px-3 py-2 text-sm text-lime-400">
            Job status updated.
          </p>
        )}

        <p className="mt-4 text-sm text-slate-400">
          {jobs.length} total · {jobs.filter((j) => j.status === "OPEN").length} open
        </p>

        <div className="mt-5 space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        job.status === "OPEN"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : job.status === "DRAFT"
                          ? "bg-slate-800 text-amber-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.department} · {job.location} · {job.employmentType}
                    {job.minExperience !== null && ` · ${job.minExperience}+ yrs`}
                  </p>
                  <p className="text-xs text-slate-400">
                    Posted {formatDate(job.createdAt)}
                    {job.deadline && ` · Deadline ${formatDate(job.deadline)}`}
                    {" · "}
                    <span className="font-medium text-slate-400">{job._count.applications} application(s)</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/jobs/${job.id}`} className="btn-soft text-xs py-1.5 px-3">
                    View
                  </Link>
                  <Link href={`/dashboard/admin/jobs/${job.id}/edit`} className="btn-soft text-xs py-1.5 px-3">
                    Edit
                  </Link>
                  <Link href={`/dashboard/admin/applications?jobId=${job.id}`} className="btn-soft text-xs py-1.5 px-3">
                    Applications
                  </Link>

                  {/* Status toggle */}
                  <form action={updateJobStatusAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={job.status === "OPEN" ? "CLOSED" : "OPEN"}
                    />
                    <input type="hidden" name="redirectPath" value="/dashboard/admin/jobs" />
                    <button
                      type="submit"
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        job.status === "OPEN"
                          ? "bg-rose-950 text-rose-600 hover:bg-rose-500/20 border border-rose-900"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-200"
                      }`}
                    >
                      {job.status === "OPEN" ? "Close" : "Reopen"}
                    </button>
                  </form>

                  {/* Delete */}
                  <DeleteJobButton jobId={job.id} redirectPath="/dashboard/admin/jobs" />

                </div>
              </div>
            </div>
          ))}

          {!jobs.length && (
            <p className="text-sm text-slate-500">No circulars yet. Use the new circular page to create one.</p>
          )}
        </div>
      </article>
    </div>
  );
}
