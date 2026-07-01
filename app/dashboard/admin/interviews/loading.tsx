export default function AdminInterviewsLoading() {
  return (
    <article className="glass-panel rounded-3xl p-6 md:p-8 animate-pulse">
      <div className="h-8 w-64 rounded-xl bg-slate-800"></div>
      
      {/* Table skeleton */}
      <div className="mt-6 overflow-x-auto">
        <div className="w-full text-sm">
          <div className="border-b border-slate-800 pb-2">
            <div className="flex gap-4">
              <div className="h-4 w-1/4 rounded bg-slate-800"></div>
              <div className="h-4 w-1/4 rounded bg-slate-800"></div>
              <div className="h-4 w-1/4 rounded bg-slate-800"></div>
              <div className="h-4 w-1/4 rounded bg-slate-800"></div>
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-6 w-1/4 rounded bg-slate-800"></div>
                <div className="h-6 w-1/4 rounded bg-slate-800"></div>
                <div className="h-6 w-1/4 rounded bg-slate-800"></div>
                <div className="h-6 w-1/4 rounded bg-slate-800"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
