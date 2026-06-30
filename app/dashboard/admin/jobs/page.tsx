import Link from "next/link";
import { Role } from "@prisma/client";
import { DeleteJobButton } from "@/components/DeleteJobButton";

import {
  createJobPostingAction,
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
      {/* Create new job */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-2xl font-bold text-slate-900">Post New Circular</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fill in the details below to publish a new job opening.
        </p>

        {params?.job === "created" && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            ✓ Circular published successfully.
          </p>
        )}
        {params?.job === "invalid" && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Please fill all required fields correctly.
          </p>
        )}

        <form action={createJobPostingAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <input name="title" className="input-field" placeholder="Position title *" required />
          <input name="department" className="input-field" placeholder="Department *" required />
          <input name="location" className="input-field" placeholder="Location *" required />
          <input name="employmentType" className="input-field" placeholder="Employment type (e.g. Full-time) *" required />
          <input
            name="minExperience"
            className="input-field"
            placeholder="Min. experience (years)"
            type="number"
            min={0}
          />
          <input name="deadline" className="input-field" type="date" />
          <textarea
            name="description"
            className="text-area md:col-span-2"
            placeholder="Role overview *"
            rows={3}
            required
          />
          <textarea
            name="requirements"
            className="text-area md:col-span-2"
            placeholder="Required skills & qualifications *"
            rows={3}
            required
          />
          <textarea
            name="responsibilities"
            className="text-area md:col-span-2"
            placeholder="Key responsibilities *"
            rows={3}
            required
          />
          <input type="hidden" name="redirectPath" value="/dashboard/admin/jobs" />
          <button type="submit" className="btn-main md:col-span-2 md:w-fit">
            Publish Circular
          </button>
        </form>
      </article>

      {/* Jobs list */}
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-2xl font-bold text-slate-900">All Circulars</h2>
        <p className="mt-1 text-sm text-slate-600">{jobs.length} total · {jobs.filter((j) => j.status === "OPEN").length} open</p>

        {params?.deleted && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Circular deleted.
          </p>
        )}
        {params?.status && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
            Job status updated.
          </p>
        )}

        <div className="mt-5 space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-amber-200 bg-white/80 p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        job.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : job.status === "DRAFT"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
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
                    <span className="font-medium text-slate-600">{job._count.applications} application(s)</span>
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
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
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
            <p className="text-sm text-slate-500">No circulars yet. Create one above.</p>
          )}
        </div>
      </article>
    </div>
  );
}
