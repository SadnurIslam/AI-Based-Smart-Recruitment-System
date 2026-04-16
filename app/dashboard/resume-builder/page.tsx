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

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-slate-900">AI Resume Builder</h1>
        <p className="mt-3 text-sm text-slate-700">
          Please complete your profile first so the system can generate resume content.
        </p>
      </article>
    );
  }

  const generatedDraft = buildResumeFromProfile({
    user: {
      name: user.name,
      email: user.email,
    },
    profile,
  });

  const resumeDraft = profile.resumeDraft || generatedDraft;

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <h1 className="text-3xl font-bold text-slate-900">AI Resume Builder</h1>
      <p className="mt-2 text-sm text-slate-700">
        Generate structured resume from profile data, then fine-tune before applying.
      </p>

      {searchParams?.built ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Resume draft generated from latest profile data.
        </p>
      ) : null}

      {searchParams?.saved ? (
        <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
          Resume draft saved.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <form action={generateResumeDraftAction}>
          <button type="submit" className="btn-main">
            Rebuild with AI
          </button>
        </form>
      </div>

      <form action={saveResumeDraftAction} className="mt-5 space-y-4">
        <textarea
          name="resumeDraft"
          defaultValue={resumeDraft}
          className="min-h-105 w-full rounded-2xl border border-amber-200 bg-white/90 p-4 text-sm leading-7 text-slate-700 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
        <button type="submit" className="btn-soft">
          Save draft
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Tip: Mention tools, frameworks, and measurable outcomes in your experience section to
        improve matching score for technical roles.
      </p>
    </article>
  );
}
