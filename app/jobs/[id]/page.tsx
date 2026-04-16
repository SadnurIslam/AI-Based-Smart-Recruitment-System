import Link from "next/link";
import { notFound } from "next/navigation";

import { applyToJobAction } from "@/app/actions/recruitment";
import { getAuthSession } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

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
          <h1 className="mt-4 text-4xl font-bold text-slate-900">{job.title}</h1>
          <p className="mt-3 text-sm text-slate-600">
            {job.location} · {job.employmentType} · Posted by {job.postedBy.name || "Recruiter"}
          </p>

          <div className="mt-7 space-y-6 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Job description</h2>
              <p className="mt-2">{job.description}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Requirements</h2>
              <p className="mt-2 whitespace-pre-line">{job.requirements}</p>
            </section>
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Responsibilities</h2>
              <p className="mt-2 whitespace-pre-line">{job.responsibilities}</p>
            </section>
          </div>

          <p className="mt-7 text-xs text-slate-500">
            Deadline: {formatDate(job.deadline)} · Minimum experience: {job.minExperience ?? 0} year(s)
          </p>
        </article>

        <aside className="glass-panel rounded-3xl p-7 md:p-8 fade-up">
          <h2 className="text-2xl font-bold text-slate-900">Apply now</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Use your profile-generated AI resume or paste CV text to get instant matching score.
          </p>

          {applied ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Application submitted successfully. AI score: {query.score || existingApplication?.aiScore || "N/A"}
            </p>
          ) : null}

          {query.error === "resume_too_short" ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Resume text is too short. Add more details about skills and experience.
            </p>
          ) : null}

          {existingApplication ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              You already applied. Current AI score: {existingApplication.aiScore}
            </div>
          ) : null}

          {session?.user?.id && session.user.role === "APPLICANT" ? (
            <form action={applyToJobAction} className="mt-5 space-y-4">
              <input type="hidden" name="jobId" value={job.id} />
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="resumeFile">
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
                <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="resumeText">
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
          ) : session?.user ? (
            <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Only applicant accounts can apply. Switch to applicant role to submit application.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-slate-700">Please sign in to apply.</p>
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
