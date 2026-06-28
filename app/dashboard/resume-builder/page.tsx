import Link from "next/link";
import { generateResumeDraftAction, saveResumeDraftAction } from "@/app/actions/recruitment";
import { buildResumeFromProfile } from "@/lib/resume-builder";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ResumeBuilderPageProps = {
  searchParams?: {
    built?: string;
    saved?: string;
  };
};

export default async function ResumeBuilderPage({ searchParams }: ResumeBuilderPageProps) {
  const user = await requireRole(["APPLICANT"]);
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    return (
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-slate-900">AI Resume Builder</h1>
        <p className="mt-3 text-sm text-slate-600">
          Complete your profile first so the system can generate your resume content.
        </p>
        <div className="mt-5">
          <Link href="/dashboard/profile" className="btn-main">
            Complete Profile →
          </Link>
        </div>
      </article>
    );
  }

  const generatedDraft = buildResumeFromProfile({
    user: { name: user.name, email: user.email },
    profile,
  });

  const resumeDraft = profile.resumeDraft || generatedDraft;

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-slate-900">AI Resume Builder</h1>
        <p className="mt-1 text-sm text-slate-600">
          Generate a structured resume from your profile, then fine-tune before applying to jobs.
        </p>

        {searchParams?.built && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            ✓ Resume draft regenerated from your latest profile data.
          </p>
        )}
        {searchParams?.saved && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
            ✓ Resume draft saved.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <form action={generateResumeDraftAction}>
            <button type="submit" className="btn-main">
              Rebuild with AI
            </button>
          </form>
          <Link href="/dashboard/profile" className="btn-soft">
            Edit Profile
          </Link>
          <Link href="/jobs" className="btn-soft">
            Browse Jobs
          </Link>
        </div>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h2 className="text-xl font-bold text-slate-900">Your Resume Draft</h2>
        <p className="mt-1 text-sm text-slate-600">
          Edit this directly and save. It will be used when you apply to jobs.
        </p>

        <form action={saveResumeDraftAction} className="mt-5 space-y-4">
          <textarea
            name="resumeDraft"
            defaultValue={resumeDraft}
            rows={28}
            className="w-full rounded-2xl border border-amber-200 bg-white/90 p-4 text-sm leading-7 text-slate-700 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 font-mono"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-main">
              Save Draft
            </button>
          </div>
        </form>

        <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-xs leading-5 text-slate-600">
          💡 Tip: Include specific tools, frameworks, and measurable outcomes (e.g. "reduced latency by 40%") in your experience section to score higher in AI matching for technical roles.
        </p>
      </article>
    </div>
  );
}
