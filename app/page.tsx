import Link from "next/link";
import { BriefcaseBusiness, ChartNoAxesCombined, Sparkles, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [openJobCount, applicationCount, applicantCount, featuredJobs] = await Promise.all([
    prisma.jobPosting.count({ where: { status: "OPEN" } }),
    prisma.application.count(),
    prisma.user.count({ where: { role: "APPLICANT" } }),
    prisma.jobPosting.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        location: true,
        department: true,
      },
    }),
  ]);

  return (
    <div>
      <section className="section-shell pb-8">
        <div className="rounded-4xl border border-slate-800/60 bg-slate-900/50 p-8 shadow-xl backdrop-blur-md md:p-12 fade-up">
          <p className="tag-pill">AI based smart recruitment system</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            DevSpark hires faster with data-driven CV matching and smart shortlisting.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Applicants can create profile-based AI resumes, apply to circulars, and get ranked by
            matching score. Recruiters instantly select top-k candidates and send interview invites
            through Gmail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/jobs" className="btn-main">
              Explore circulars
            </Link>
            <Link href="/auth/signup" className="btn-soft">
              Start as applicant
            </Link>
          </div>
        </div>
      </section>

      <section className="section-shell pt-2">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="glass-panel rounded-3xl p-6">
            <div className="inline-flex rounded-2xl bg-teal-500/20 p-2 text-teal-800">
              <BriefcaseBusiness size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{openJobCount}</p>
            <p className="mt-1 text-sm text-slate-400">Active circulars</p>
          </article>
          <article className="glass-panel rounded-3xl p-6">
            <div className="inline-flex rounded-2xl bg-orange-100 p-2 text-orange-700">
              <UsersRound size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{applicantCount}</p>
            <p className="mt-1 text-sm text-slate-400">Registered applicants</p>
          </article>
          <article className="glass-panel rounded-3xl p-6">
            <div className="inline-flex rounded-2xl bg-slate-800 p-2 text-slate-300">
              <ChartNoAxesCombined size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold text-white">{applicationCount}</p>
            <p className="mt-1 text-sm text-slate-400">Applications processed</p>
          </article>
        </div>
      </section>

      <section className="section-shell">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="glass-panel rounded-3xl p-7">
            <p className="tag-pill">How it works</p>
            <h2 className="mt-4 text-3xl font-bold text-white">From circular to interview invite</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>1. Recruiter publishes circular with requirements and responsibilities.</li>
              <li>2. Applicant updates profile and builds AI resume.</li>
              <li>3. AI matching engine scores CV against circular requirements.</li>
              <li>4. Recruiter selects top-k candidates and sends Gmail interview invitations.</li>
            </ul>
          </article>

          <article className="glass-panel rounded-3xl p-7">
            <p className="tag-pill">Featured circulars</p>
            <h2 className="mt-4 text-3xl font-bold text-white">Apply to open positions</h2>
            <div className="mt-5 space-y-3">
              {featuredJobs.length ? (
                featuredJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between rounded-2xl border border-amber-100 bg-slate-900/50 px-4 py-3 transition hover:border-teal-200"
                  >
                    <div>
                      <p className="font-semibold text-white">{job.title}</p>
                      <p className="text-xs text-slate-400">
                        {job.department} · {job.location}
                      </p>
                    </div>
                    <Sparkles className="text-lime-400" size={16} />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-400">No active circulars yet.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
