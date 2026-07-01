import { Role } from "@prisma/client";

import { requireRole } from "@/lib/guards";
import { CopilotChat } from "./copilot-chat";

export const dynamic = "force-dynamic";

export default async function CopilotPage() {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-3xl font-bold text-white">AI Recruiter Copilot</h1>
        <p className="mt-1 text-sm text-slate-400">
          Ask in plain language — the copilot uses live recruitment tools (shortlist,
          job match, scoring, stats, scheduling) over your real data.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
          {[
            "Show hiring stats",
            "Shortlist the top 5 for the Backend Engineer role",
            "Which open jobs match applicant@example.com?",
          ].map((s) => (
            <span key={s} className="rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1">
              {s}
            </span>
          ))}
        </div>
      </article>

      <CopilotChat />
    </div>
  );
}
