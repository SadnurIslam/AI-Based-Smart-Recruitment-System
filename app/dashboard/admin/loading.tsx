export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="h-8 w-64 rounded-xl bg-slate-800"></div>
        <div className="mt-4 h-4 w-96 rounded-xl bg-slate-800"></div>
        <div className="mt-4 h-4 w-72 rounded-xl bg-slate-800"></div>
      </article>

      {/* KPI grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="h-4 w-24 rounded-lg bg-slate-800"></div>
            <div className="mt-4 h-8 w-16 rounded-xl bg-slate-800"></div>
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="h-6 w-40 rounded-xl bg-slate-800"></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="h-8 w-8 rounded-lg bg-slate-800"></div>
              <div className="mt-3 h-5 w-32 rounded-lg bg-slate-800"></div>
              <div className="mt-2 h-4 w-40 rounded-lg bg-slate-800"></div>
            </div>
          ))}
        </div>
      </article>

      {/* Top AI-scored applicants skeleton */}
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="h-6 w-48 rounded-xl bg-slate-800"></div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-slate-800"></div>
          ))}
        </div>
      </article>
    </div>
  );
}
