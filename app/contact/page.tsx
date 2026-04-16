export default function ContactPage() {
  return (
    <section className="section-shell">
      <div className="grid gap-6 md:grid-cols-2">
        <article className="glass-panel rounded-3xl p-8 md:p-10 fade-up">
          <p className="tag-pill">Contact us</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Let us know your recruitment needs</h1>
          <p className="mt-4 leading-7 text-slate-700">
            For university demo or product feedback, reach out to DevSpark recruitment team.
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-700">
            <p>Email: careers@devspark.example</p>
            <p>Phone: +880-1X-XXXXXXX</p>
            <p>Office: Banani, Dhaka</p>
          </div>
        </article>

        <article className="glass-panel rounded-3xl p-8 md:p-10 fade-up">
          <h2 className="text-2xl font-bold text-slate-900">Send a message</h2>
          <form className="mt-6 space-y-4">
            <input className="input-field" placeholder="Your name" />
            <input className="input-field" type="email" placeholder="Your email" />
            <textarea className="text-area" placeholder="Write your message" />
            <button type="button" className="btn-main w-full">
              Submit
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
