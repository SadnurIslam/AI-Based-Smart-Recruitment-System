import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard");
  }

  const isAdmin = session.user.role === Role.ADMIN;
  const isStaff = isAdmin || session.user.role === Role.RECRUITER;

  const links = isStaff
    ? [
        { href: "/dashboard/admin", label: "Overview" },
        { href: "/dashboard/admin/jobs", label: "Job Circulars" },
        { href: "/dashboard/admin/applications", label: "Applications" },
        { href: "/dashboard/admin/interviews", label: "Interview Schedule" },
        { href: "/dashboard/admin/copilot", label: "AI Copilot" },
        { href: "/dashboard/admin/mcp", label: "MCP Console" },
        // User management is admin-only.
        ...(isAdmin ? [{ href: "/dashboard/admin/users", label: "Users" }] : []),
        { href: "/jobs", label: "Public Board" },
      ]
    : [
        { href: "/dashboard/applicant", label: "My Dashboard" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/resume-builder", label: "Resume Builder" },
        // { href: "/dashboard/applicant/score-resume", label: "Score Resume" },
        // { href: "/dashboard/applicant/job-match", label: "Job Match" },
        { href: "/dashboard/applicant/applications", label: "My Applications" },
        { href: "/dashboard/applicant/interviews", label: "My Interviews" },
        { href: "/dashboard/applicant/copilot", label: "AI Career Assistant" },
        { href: "/jobs", label: "Open Circulars" },
      ];

  return (
    <section className="section-shell">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass-panel h-fit rounded-3xl p-5 fade-up sticky top-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
          <p className="mt-1 truncate text-base font-semibold text-slate-100">
            {session.user.name || session.user.email}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
              isAdmin
                ? "bg-lime-500/20 text-lime-400"
                : "bg-teal-500/20 text-teal-400"
            }`}
          >
            {session.user.role}
          </span>

          <nav className="mt-5 space-y-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800/80 hover:text-[#b5ff14]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </section>
  );
}
