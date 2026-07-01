import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminInterviewsPage() {
  await requireRole([Role.ADMIN, Role.RECRUITER]);

  const invites = await prisma.interviewInvite.findMany({
    where: {
      scheduledStart: { not: null },
    },
    include: {
      application: {
        include: {
          job: { select: { title: true } },
          applicant: { select: { name: true, email: true } },
        },
      },
      sentBy: { select: { name: true, email: true } },
    },
    orderBy: {
      scheduledStart: "asc",
    },
  });

  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Interview Schedule
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Upcoming and past scheduled interviews across all open positions.
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="border-b border-slate-800 bg-slate-900/40 text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Candidate</th>
              <th className="px-4 py-3 font-semibold">Job Post</th>
              <th className="px-4 py-3 font-semibold">Scheduled Time</th>
              <th className="px-4 py-3 font-semibold">Sent By</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 bg-slate-900/30">
            {invites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No scheduled interviews found.
                </td>
              </tr>
            ) : (
              invites.map((invite) => {
                const tz = invite.timezone || "UTC";
                const startStr = invite.scheduledStart?.toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: tz,
                });
                const endStr = invite.scheduledEnd?.toLocaleString("en-US", {
                  timeStyle: "short",
                  timeZone: tz,
                });
                
                const timeString = startStr && endStr ? `${startStr} - ${endStr} (${tz})` : "Not scheduled";
                
                return (
                  <tr key={invite.id} className="transition hover:bg-slate-900/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">
                        {invite.application.applicant.name || "Unknown"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {invite.application.applicant.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-300">
                      {invite.application.job.title}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {timeString}
                    </td>
                    <td className="px-4 py-3">
                      {invite.sentBy.name || invite.sentBy.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          invite.emailDeliveryStatus === "DELIVERED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-800 text-amber-400"
                        }`}
                      >
                        {invite.emailDeliveryStatus || "UNKNOWN"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
