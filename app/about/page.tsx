export default function AboutPage() {
  return (
    <section className="section-shell">
      <div className="glass-panel rounded-3xl p-8 md:p-10 fade-up">
        <p className="tag-pill">About DevSpark</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Building modern teams with smarter hiring</h1>
        <p className="mt-6 max-w-3xl leading-7 text-slate-300">
          DevSpark is a software company that hires for roles like Web Developer, Software Engineer,
          Project Manager, and SQA Engineer. This project demonstrates how AI can reduce manual CV
          screening effort by scoring candidate-job relevance and helping recruiters focus on top
          profiles first.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-xl font-semibold text-white">Mission</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Make recruitment transparent, efficient, and evidence-driven using practical AI.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-xl font-semibold text-white">Vision</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Empower every applicant with a fair and structured evaluation process.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-xl font-semibold text-white">Core Values</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Quality software, candidate respect, measurable hiring outcomes.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
