import Link from "next/link";

import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CareersPage() {
  const jobs = await prisma.jobPosting.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      location: true,
      department: true,
      createdAt: true,
    },
  });

  return (
    <section className="section-shell">
      <div className="glass-panel rounded-3xl p-8 md:p-10 fade-up">
        <p className="tag-pill">Careers at DevSpark</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900">Join a team that ships useful software</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-700">
          We hire curious builders across web development, software engineering, project management,
          and quality assurance. Use your profile or AI resume builder to apply quickly.
        </p>

        <div className="mt-8 grid gap-4">
          {jobs.length ? (
            jobs.map((job) => (
              <article
                key={job.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-white/80 p-5 md:flex-row md:items-center"
              >
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                  <p className="text-sm text-slate-600">
                    {job.department} · {job.location} · Posted {formatDate(job.createdAt)}
                  </p>
                </div>
                <Link href={`/jobs/${job.id}`} className="btn-soft text-center">
                  View circular
                </Link>
              </article>
            ))
          ) : (
            <p className="text-slate-700">No circulars are open right now.</p>
          )}
        </div>
      </div>
    </section>
  );
}
