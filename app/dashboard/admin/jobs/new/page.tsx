import Link from "next/link";
import { Role } from "@prisma/client";

import { createJobPostingAction } from "@/app/actions/recruitment";
import { requireRole } from "@/lib/guards";

export const dynamic = "force-dynamic";

type NewJobPageProps = {
  searchParams?: Promise<{
    job?: string;
  }>;
};

export default async function NewJobPage({ searchParams }: NewJobPageProps) {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const params = await searchParams;

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Post New Circular</h1>
          <p className="mt-1 text-sm text-slate-400">
            Fill in the details below to publish a new opening.
          </p>
        </div>

        <Link href="/dashboard/admin/jobs" className="btn-soft w-fit">
          View All Circulars
        </Link>
      </div>

      {params?.job === "created" && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-400">
          ✓ Circular published successfully.
        </p>
      )}
      {params?.job === "invalid" && (
        <p className="mt-4 rounded-xl border border-rose-900 bg-rose-950 px-3 py-2 text-sm text-rose-400">
          Please fill all required fields.
        </p>
      )}

      <form action={createJobPostingAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input name="title" className="input-field" placeholder="Position title *" required />
        <input name="department" className="input-field" placeholder="Department *" required />
        <input name="location" className="input-field" placeholder="Location *" required />
        <input
          name="employmentType"
          className="input-field"
          placeholder="Employment type (e.g. Full-time) *"
          required
        />
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
        <input type="hidden" name="redirectPath" value="/dashboard/admin/jobs/new" />
        <button type="submit" className="btn-main md:col-span-2 md:w-fit">
          Publish Circular
        </button>
      </form>
    </article>
  );
}