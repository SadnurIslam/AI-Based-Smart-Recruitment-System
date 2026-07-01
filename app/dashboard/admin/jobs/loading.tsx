export default function AdminJobsLoading() {
  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-xl bg-slate-800"></div>
        <div className="h-10 w-32 rounded-xl bg-slate-800"></div>
      </div>
      <div className="mt-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-full rounded-2xl bg-slate-800"></div>
        ))}
      </div>
    </article>
  );
}
