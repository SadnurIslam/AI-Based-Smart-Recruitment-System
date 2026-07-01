"use client";

import { deleteJobPostingAction } from "@/app/actions/recruitment";

type DeleteJobButtonProps = {
  jobId: string;
  redirectPath?: string;
};

export function DeleteJobButton({ jobId, redirectPath = "/dashboard/admin/jobs" }: DeleteJobButtonProps) {
  return (
    <form
      action={deleteJobPostingAction}
      onSubmit={(e) => {
        if (!confirm("Delete this circular and all its applications? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="redirectPath" value={redirectPath} />
      <button
        type="submit"
        className="rounded-xl border border-rose-900 bg-rose-950 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-500/20"
      >
        Delete
      </button>
    </form>
  );
}
