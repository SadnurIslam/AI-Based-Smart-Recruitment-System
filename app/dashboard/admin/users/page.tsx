import { Role } from "@prisma/client";

import { updateUserRoleAction, deleteUserAction } from "@/app/actions/recruitment";
import { formatDate } from "@/lib/date";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type UsersPageProps = {
  searchParams?: Promise<{
    role?: string;
    updated?: string;
    deleted?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  await requireRole([Role.ADMIN]);

  const params = await searchParams;
  const roleFilter = params?.role as Role | undefined;

  const [users, applicantCount, adminCount] = await Promise.all([
    prisma.user.findMany({
      where: roleFilter ? { role: roleFilter } : {},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: Role.APPLICANT } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
  ]);

  const totalUsers = applicantCount + adminCount;

  return (
    <div className="space-y-6">
      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage all registered users, update roles, or remove accounts.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Users", value: totalUsers },
            { label: "Applicants", value: applicantCount },
            { label: "Admins", value: adminCount },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-amber-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {params?.updated && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
            ✓ User role updated.
          </p>
        )}
        {params?.deleted && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            User account deleted.
          </p>
        )}
      </article>

      <article className="glass-panel rounded-3xl p-6 md:p-8 fade-up">
        {/* Role filter tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {["", "APPLICANT", "ADMIN"].map((r) => {
            const label = r === "" ? `All (${totalUsers})` : r === "APPLICANT" ? `Applicants (${applicantCount})` : `Admins (${adminCount})`;
            return (
              <a
                key={r}
                href={r ? `/dashboard/admin/users?role=${r}` : "/dashboard/admin/users"}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition border ${
                  (roleFilter || "") === r
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-amber-200 text-slate-700 hover:border-teal-300"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Applications</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Change Role</th>
                <th className="px-3 py-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-amber-100/70 hover:bg-amber-50/40 transition">
                  <td className="px-3 py-2 font-medium text-slate-900">{u.name || "Unnamed"}</td>
                  <td className="px-3 py-2 text-slate-600">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === Role.ADMIN
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{u._count.applications}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-2">
                    <form action={updateUserRoleAction} className="flex items-center gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="redirectPath" value="/dashboard/admin/users?updated=1" />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-teal-400"
                      >
                        <option value="APPLICANT">Applicant</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200 transition"
                      >
                        Set
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <form action={deleteUserAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="redirectPath" value="/dashboard/admin/users?deleted=1" />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100 transition"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && (
            <p className="mt-4 text-sm text-slate-500">No users found.</p>
          )}
        </div>
      </article>
    </div>
  );
}
