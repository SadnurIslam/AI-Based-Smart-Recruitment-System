import Link from "next/link";
import { notFound } from "next/navigation";

import { applyToJobAction } from "@/app/actions/recruitment";
import { getAuthSession } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { AnalyzeFitButton } from "./AnalyzeFitButton";

export const dynamic = "force-dynamic";

type JobDetailsPageProps = {
  params: Promise<{
    id?: string;
  }>;
  searchParams?: Promise<{
    applied?: string;
    score?: string;
    error?: string;
  }>;
};

export default async function JobDetailsPage({ params, searchParams }: JobDetailsPageProps) {
  const [{ id }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as { applied?: string; score?: string; error?: string }),
  ]);

  if (!id) {
    notFound();
  }

  const session = await getAuthSession();

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      postedBy: {
        select: { name: true },
      },
    },
  });

  if (!job || job.status === "DRAFT") {
    notFound();
  }

  const existingApplication = session?.user?.id
    ? await prisma.application.findUnique({
        where: {
          jobId_applicantId: {
            jobId: job.id,
            applicantId: session.user.id,
          },
        },
      })
    : null;

  const applied = query.applied === "1";

  return (
    <section className="section-shell">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="glass-panel rounded-3xl p-7 md:p-9 fade-up">
          <p className="tag-pill">{job.department}</p>
          <h1 className="mt-4 text-4xl font-bold text-white">{job.title}</h1>
          <p className="mt-3 text-sm text-slate-400">
            {job.location} · {job.employmentType} · Posted by {job.postedBy.name || "Recruiter"}
          </p>

          <div className="mt-7 space-y-6 text-sm leading-7 text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-white">Job description</h2>
              <p className="mt-2">{job.description}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white">Requirements</h2>
              <p className="mt-2 whitespace-pre-line">{job.requirements}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-white">Responsibilities</h2>
              <p className="mt-2 whitespace-pre-line">{job.responsibilities}</p>
            </section>
          </div>

          <p className="mt-7 text-xs text-slate-500">
            Deadline: {formatDate(job.deadline)} · Minimum experience: {job.minExperience ?? 0} year(s)
          </p>
        </article>

        <aside className="glass-panel rounded-3xl p-7 md:p-8 fade-up">
          <h2 className="text-2xl font-bold text-white">Apply now</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use your profile-generated AI resume or paste CV text to get instant matching score.
          </p>

          {applied ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-400">
              Application submitted successfully. AI score: {query.score || existingApplication?.aiScore || "N/A"}
            </p>
          ) : null}

          {query.error === "resume_too_short" ? (
            <p className="mt-4 rounded-2xl border border-rose-900 bg-rose-950 px-4 py-3 text-sm text-rose-400">
              Resume text is too short. Add more details about skills and experience.
            </p>
          ) : null}

          {existingApplication ? (
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-amber-400">
              You already applied. Current AI score: {existingApplication.aiScore}
            </div>
          ) : null}

          {session?.user?.id && session.user.role === "APPLICANT" ? (
            <>
              <AnalyzeFitButton jobId={job.id} />
              
              <form action={applyToJobAction} className="mt-5 space-y-4">
              <input type="hidden" name="jobId" value={job.id} />
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-300" htmlFor="resumeFile">
                  Upload CV text file (.txt, .md)
                </label>
                <input
                  id="resumeFile"
                  name="resumeFile"
                  type="file"
                  accept=".txt,.md"
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-300" htmlFor="resumeText">
                  Paste CV text (used when file is not uploaded)
                </label>
                <textarea
                  id="resumeText"
                  name="resumeText"
                  className="text-area"
                  placeholder="Paste your CV content here to apply using uploaded/pasted resume text..."
                />
              </div>
              <div className="grid gap-3">
                <button type="submit" name="source" value="PASTE" className="btn-main">
                  Apply with uploaded/pasted CV
                </button>
                <button type="submit" name="source" value="BUILDER" className="btn-soft">
                  Apply with AI resume builder draft
                </button>
              </div>
            </form>
            </>
          ) : session?.user ? (
            <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-300">
              Only applicant accounts can apply. Switch to applicant role to submit application.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-slate-300">Please sign in to apply.</p>
              <Link href="/auth/signin" className="btn-main inline-block">
                Sign in
              </Link>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
