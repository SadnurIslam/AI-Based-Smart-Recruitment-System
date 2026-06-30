import { sendContactMessageAction } from "@/app/actions/contact";

type ContactPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
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
          {params?.status === "sent" ? (
            <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Your message has been sent to the DevSpark team.
            </p>
          ) : null}
          {params?.status === "simulated" ? (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Email delivery is not configured yet, but your message was accepted for the demo flow.
            </p>
          ) : null}
          {params?.status === "invalid" ? (
            <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Please provide a valid name, email, and message.
            </p>
          ) : null}
        </article>

        <article className="glass-panel rounded-3xl p-8 md:p-10 fade-up">
          <h2 className="text-2xl font-bold text-slate-900">Send a message</h2>
          <form action={sendContactMessageAction} className="mt-6 space-y-4">
            <input className="input-field" name="name" placeholder="Your name" required />
            <input className="input-field" name="email" type="email" placeholder="Your email" required />
            <textarea className="text-area" name="message" placeholder="Write your message" required />
            <button type="submit" className="btn-main w-full">
              Submit
            </button>
          </form>
        </article>
      </div>
    </section>
  );
}
