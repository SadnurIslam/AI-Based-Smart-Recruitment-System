export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-6 py-12 md:py-20">
      <div className="mb-10 text-center">
        <div className="mx-auto h-10 w-64 rounded-xl bg-slate-800"></div>
        <div className="mx-auto mt-4 h-5 w-96 rounded-xl bg-slate-800"></div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="glass-panel block rounded-3xl p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="h-6 w-3/4 rounded-xl bg-slate-800"></div>
                <div className="mt-2 h-4 w-1/2 rounded-xl bg-slate-800"></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="h-6 w-16 rounded-full bg-slate-800"></div>
                  <div className="h-6 w-20 rounded-full bg-slate-800"></div>
                  <div className="h-6 w-24 rounded-full bg-slate-800"></div>
                </div>
              </div>
              <div className="h-10 w-28 rounded-full bg-slate-800"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
