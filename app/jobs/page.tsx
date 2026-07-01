import Link from "next/link";

import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await prisma.jobPosting.findMany({
    where: { status: "OPEN" },
    include: {
      postedBy: {
        select: { name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section className="section-shell">
      <div className="mb-8 rounded-3xl border border-slate-800/60 bg-slate-900/50 p-8 backdrop-blur-sm fade-up">
        <p className="tag-pill">Open circulars</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Find your next role at DevSpark</h1>
        <p className="mt-3 text-slate-300">
          Apply using pasted CV content or your profile-powered AI resume builder draft.
        </p>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <article key={job.id} className="glass-panel rounded-3xl p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-semibold text-white">{job.title}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {job.department} · {job.location} · {job.employmentType}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{job.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Posted by {job.postedBy.name || "Recruiter"} on {formatDate(job.createdAt)} · {" "}
                  {job._count.applications} application(s)
                </p>
              </div>
              <Link href={`/jobs/${job.id}`} className="btn-main text-center">
                View & apply
              </Link>
            </div>
          </article>
        ))}

        {!jobs.length ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-slate-300">
            No open circulars right now. Recruiters can publish jobs from dashboard.
          </p>
        ) : null}
      </div>
    </section>
  );
}
