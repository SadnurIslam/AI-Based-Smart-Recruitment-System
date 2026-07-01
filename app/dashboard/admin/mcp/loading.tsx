export default function McpConsoleLoading() {
  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-slate-700"></div>
        <div className="h-4 w-64 rounded-xl bg-slate-800"></div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Tool list skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="block w-full rounded-2xl border border-transparent bg-slate-900/50 p-4">
              <div className="h-5 w-32 rounded-lg bg-slate-800"></div>
              <div className="mt-2 h-3 w-full rounded-lg bg-slate-800"></div>
            </div>
          ))}
        </div>

        {/* Tool runner skeleton */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="h-6 w-48 rounded-xl bg-slate-800"></div>
          <div className="mt-2 h-4 w-72 rounded-xl bg-slate-800"></div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="h-4 w-24 rounded-lg bg-slate-800"></div>
              <div className="mt-1 h-10 w-full rounded-xl bg-slate-800"></div>
            </div>
            <div>
              <div className="h-4 w-24 rounded-lg bg-slate-800"></div>
              <div className="mt-1 h-10 w-full rounded-xl bg-slate-800"></div>
            </div>
          </div>

          <div className="mt-6 h-10 w-32 rounded-full bg-slate-800"></div>
        </div>
      </div>
    </article>
  );
}
