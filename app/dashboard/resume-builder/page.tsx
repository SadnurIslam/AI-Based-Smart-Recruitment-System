import Link from "next/link";
import { generateResumeDraftAction, saveResumeDraftAction, polishResumeAction } from "@/app/actions/recruitment";
import { buildResumeFromProfile } from "@/lib/resume-builder";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ResumeBuilderPageProps = {
  searchParams?: Promise<{
    built?: string;
    saved?: string;
    polished?: string;
  }>;
};

export default async function ResumeBuilderPage({ searchParams }: ResumeBuilderPageProps) {
  const user = await requireRole(["APPLICANT"]);
  const params = await searchParams;
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    return (
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-white">AI Resume Builder</h1>
        <p className="mt-3 text-sm text-slate-400">
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
        <h1 className="text-3xl font-bold text-white">AI Resume Builder</h1>
        <p className="mt-1 text-sm text-slate-400">
          Generate a structured resume from your profile, then fine-tune before applying to jobs.
        </p>

        {params?.built && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-400">
            ✓ Resume draft regenerated from your latest profile data.
          </p>
        )}
        {params?.saved && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-500/10 px-3 py-2 text-sm text-lime-400">
            ✓ Resume draft saved.
          </p>
        )}
        {params?.polished && (
          <p className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-400">
            ✨ AI polished your resume draft. Review and save it.
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
        <h2 className="text-xl font-bold text-white">Your Resume Draft</h2>
        <p className="mt-1 text-sm text-slate-400">
          Edit this directly and save. It will be used when you apply to jobs.
        </p>

        <form action={saveResumeDraftAction} className="mt-5 space-y-4">
          <textarea
            name="resumeDraft"
            defaultValue={resumeDraft}
            rows={28}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm leading-7 text-slate-300 shadow-sm outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 font-mono"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-main">
              Save Draft
            </button>
            <button type="submit" formAction={polishResumeAction} className="btn-soft bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/30">
              ✨ AI Polish (Auto-Enhance)
            </button>
          </div>
        </form>

        <p className="mt-4 rounded-xl border border-amber-100 bg-slate-900/50/60 px-4 py-3 text-xs leading-5 text-slate-400">
          💡 Tip: Include specific tools, frameworks, and measurable outcomes (e.g. "reduced latency by 40%") in your experience section to score higher in AI matching for technical roles.
        </p>
      </article>
    </div>
  );
}
