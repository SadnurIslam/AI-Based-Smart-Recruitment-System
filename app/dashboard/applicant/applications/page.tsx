import Link from "next/link";

import { formatDate, formatDateTime } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ApplicantApplicationsPage() {
  const user = await requireRole(["APPLICANT"]);

  const applications = await prisma.application.findMany({
    where: { applicantId: user.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          department: true,
          location: true,
        },
      },
      invites: {
        where: {
          scheduledStart: {
            not: null,
          },
        },
        orderBy: {
          scheduledStart: "desc",
        },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 fade-up">
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <h1 className="text-3xl font-bold text-white">My Applications</h1>
        <p className="mt-2 text-sm text-slate-400">
          Review your submitted applications, AI scores, and interview progress.
        </p>
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-2 py-2">Position</th>
                <th className="px-2 py-2">Department</th>
                <th className="px-2 py-2">Location</th>
                <th className="px-2 py-2">AI score</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Interview slot</th>
                <th className="px-2 py-2">Applied on</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => {
                const latestInvite = application.invites[0];

                return (
                  <tr key={application.id} className="border-b border-slate-800">
                    <td className="px-2 py-2 font-medium text-white">
                      <Link href={`/jobs/${application.job.id}`} className="hover:text-teal-300">
                        {application.job.title}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-slate-300">{application.job.department}</td>
                    <td className="px-2 py-2 text-slate-300">{application.job.location}</td>
                    <td className="px-2 py-2 text-slate-300">{application.aiScore.toFixed(0)}</td>
                    <td className="px-2 py-2 text-slate-300">{application.status}</td>
                    <td className="px-2 py-2 text-slate-300">
                      {latestInvite?.scheduledStart
                        ? `${formatDateTime(latestInvite.scheduledStart, latestInvite.timezone || undefined)}${
                            latestInvite.meetingUrl ? " (link shared)" : ""
                          }`
                        : "Not scheduled"}
                    </td>
                    <td className="px-2 py-2 text-slate-300">{formatDate(application.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!applications.length ? (
            <p className="mt-4 text-sm text-slate-400">
              No applications yet. Start from the open circulars page.
            </p>
          ) : null}
        </div>
      </article>
    </div>
  );
}