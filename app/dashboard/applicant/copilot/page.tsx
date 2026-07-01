import { Role } from "@prisma/client";
import { requireRole } from "@/lib/guards";
import { ApplicantChat } from "./applicant-chat";

export default async function ApplicantCopilotPage() {
  await requireRole([Role.APPLICANT]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="fade-up">
        <h1 className="text-3xl font-bold text-white">AI Career Assistant</h1>
        <p className="mt-2 text-sm text-slate-400">
          Chat with your AI assistant to find jobs that perfectly match your skills and get career advice.
        </p>
      </div>

      <ApplicantChat />
    </div>
  );
}
