import { requireRole } from "@/lib/guards";
import { ApplicantRecruitmentTools } from "../recruitment-tools";

export const dynamic = "force-dynamic";

export default async function JobMatchPage() {
  await requireRole(["APPLICANT"]);

  return (
    <div className="space-y-6 fade-up">
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-white">Find Matching Jobs</h1>
        <p className="mt-2 text-sm text-slate-400">
          Use your profile or paste a resume to discover the best open circulars.
        </p>
      </article>

      <ApplicantRecruitmentTools mode="match" />
    </div>
  );
}