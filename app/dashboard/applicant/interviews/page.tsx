import Link from "next/link";

import { formatDateTime } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function ApplicantInterviewsPage() {
  const user = await requireRole(["APPLICANT"]);

  const invites = await prisma.interviewInvite.findMany({
    where: {
      application: { applicantId: user.id },
    },
    include: {
      application: {
        include: {
          job: { select: { id: true, title: true, department: true, location: true } },
        },
      },
      sentBy: { select: { name: true, email: true } },
    },
    orderBy: [{ scheduledStart: "desc" }, { sentAt: "desc" }],
  });

  return (
    <div className="space-y-6 fade-up">
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-white">My Interviews</h1>
        <p className="mt-2 text-sm text-slate-400">
          Track interview invitations, scheduled times, and current status.
        </p>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8">
        {invites.length ? (
          <div className="space-y-4">
            {invites.map((invite) => {
              const status = invite.application.status;

              return (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {invite.application.job.title}
                      </h2>
                      <p className="text-sm text-slate-400">
                        {invite.application.job.department} · {invite.application.job.location}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Interview status: <span className="font-medium text-white">{status}</span>
                      </p>
                      <p className="text-sm text-slate-300">
                        Schedule: {invite.scheduledStart && invite.scheduledEnd
                          ? `${formatDateTime(invite.scheduledStart, invite.timezone || undefined)} - ${formatDateTime(invite.scheduledEnd, invite.timezone || undefined)}`
                          : "Not scheduled yet"}
                      </p>
                      <p className="text-sm text-slate-300">
                        Invite delivery: {invite.emailDeliveryStatus || "UNKNOWN"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {invite.meetingUrl ? (
                        <a href={invite.meetingUrl} target="_blank" rel="noreferrer" className="btn-main text-xs py-1.5 px-3">
                          Open meeting
                        </a>
                      ) : null}
                      <Link href={`/jobs/${invite.application.job.id}`} className="btn-soft text-xs py-1.5 px-3">
                        View job
                      </Link>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Sent by {invite.sentBy.name || invite.sentBy.email} · {formatDateTime(invite.sentAt)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No interview invitations yet.</p>
        )}
      </article>
    </div>
  );
}