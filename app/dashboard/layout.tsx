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

  const links = isAdmin
    ? [
        { href: "/dashboard/admin", label: "Overview" },
        { href: "/dashboard/admin/jobs", label: "Job Circulars" },
        { href: "/dashboard/admin/applications", label: "Applications" },
        { href: "/dashboard/admin/users", label: "Users" },
        { href: "/jobs", label: "Public Board" },
      ]
    : [
        { href: "/dashboard/applicant", label: "My Dashboard" },
        { href: "/dashboard/profile", label: "Profile" },
        { href: "/dashboard/resume-builder", label: "Resume Builder" },
        { href: "/jobs", label: "Open Circulars" },
      ];

  return (
    <section className="section-shell">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass-panel h-fit rounded-3xl p-5 fade-up sticky top-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">Signed in as</p>
          <p className="mt-1 truncate text-base font-semibold text-slate-900">
            {session.user.name || session.user.email}
          </p>
          <span
            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
              isAdmin
                ? "bg-indigo-100 text-indigo-700"
                : "bg-teal-100 text-teal-700"
            }`}
          >
            {session.user.role}
          </span>

          <nav className="mt-5 space-y-1">
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
