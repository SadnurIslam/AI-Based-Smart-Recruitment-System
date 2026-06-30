import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { updateJobPostingAction } from "@/app/actions/recruitment";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// type EditJobPageProps = {
//   params: { id: string };
//   searchParams?: { saved?: string };
// };

type EditJobPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
};

export default async function EditJobPage({ params, searchParams }: EditJobPageProps) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const job = await prisma.jobPosting.findUnique({ where: { id } });

  if (!job) notFound();

  const deadlineValue = job.deadline
    ? new Date(job.deadline).toISOString().slice(0, 10)
    : "";

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Edit Circular</h1>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
            job.status === "OPEN"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {job.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Update the details for <strong>{job.title}</strong>.
      </p>

      {resolvedSearchParams?.saved && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          ✓ Changes saved successfully.
        </p>
      )}

      <form action={updateJobPostingAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="jobId" value={job.id} />
        <input type="hidden" name="redirectPath" value={`/dashboard/admin/jobs/${job.id}/edit?saved=1`} />

        <input
          name="title"
          className="input-field"
          defaultValue={job.title}
          placeholder="Position title *"
          required
        />
        <input
          name="department"
          className="input-field"
          defaultValue={job.department}
          placeholder="Department *"
          required
        />
        <input
          name="location"
          className="input-field"
          defaultValue={job.location}
          placeholder="Location *"
          required
        />
        <input
          name="employmentType"
          className="input-field"
          defaultValue={job.employmentType}
          placeholder="Employment type *"
          required
        />
        <input
          name="minExperience"
          className="input-field"
          defaultValue={job.minExperience ?? ""}
          placeholder="Min. experience (years)"
          type="number"
          min={0}
        />
        <input
          name="deadline"
          className="input-field"
          type="date"
          defaultValue={deadlineValue}
        />
        <select name="status" className="input-field" defaultValue={job.status}>
          <option value="OPEN">Open</option>
          <option value="DRAFT">Draft</option>
          <option value="CLOSED">Closed</option>
        </select>

        <textarea
          name="description"
          className="text-area md:col-span-2"
          defaultValue={job.description}
          placeholder="Role overview *"
          rows={3}
          required
        />
        <textarea
          name="requirements"
          className="text-area md:col-span-2"
          defaultValue={job.requirements}
          placeholder="Required skills & qualifications *"
          rows={3}
          required
        />
        <textarea
          name="responsibilities"
          className="text-area md:col-span-2"
          defaultValue={job.responsibilities}
          placeholder="Key responsibilities *"
          rows={3}
          required
        />

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button type="submit" className="btn-main">
            Save Changes
          </button>
          <a href="/dashboard/admin/jobs" className="btn-soft">
            Cancel
          </a>
        </div>
      </form>
    </article>
  );
}
