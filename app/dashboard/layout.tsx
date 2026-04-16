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

  const baseLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/profile", label: "Profile" },
    { href: "/dashboard/resume-builder", label: "Resume Builder" },
    { href: "/jobs", label: "Open Circulars" },
  ];

  const roleLinks =
    session.user.role === Role.APPLICANT
      ? [{ href: "/dashboard/applicant", label: "Applicant Home" }]
      : [{ href: "/dashboard/recruiter", label: "Recruiter Home" }];

  if (session.user.role === Role.ADMIN) {
    roleLinks.push({ href: "/dashboard/admin", label: "Admin Panel" });
  }

  const links = [...roleLinks, ...baseLinks];

  return (
    <section className="section-shell">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass-panel h-fit rounded-3xl p-5 fade-up">
          <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{session.user.name || session.user.email}</p>
          <p className="text-xs font-semibold text-teal-700">{session.user.role}</p>

          <nav className="mt-5 space-y-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-amber-100 hover:text-slate-900"
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
