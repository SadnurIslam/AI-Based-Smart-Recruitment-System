export default function ApplicantDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="h-8 w-64 rounded-xl bg-slate-800"></div>
        <div className="mt-4 h-4 w-96 rounded-xl bg-slate-800"></div>
      </article>

      {/* KPI grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="h-4 w-24 rounded-lg bg-slate-800"></div>
            <div className="mt-4 h-8 w-16 rounded-xl bg-slate-800"></div>
          </div>
        ))}
      </div>

      {/* Applications list skeleton */}
      <article className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="h-6 w-48 rounded-xl bg-slate-800"></div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full rounded-xl bg-slate-800"></div>
          ))}
        </div>
      </article>
    </div>
  );
}
