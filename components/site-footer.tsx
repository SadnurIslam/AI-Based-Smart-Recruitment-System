import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-amber-200/70 bg-amber-50/80">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-slate-900">DevSpark</p>
          <p className="mt-2 leading-6">
            AI-based smart recruitment platform to shortlist top applicants, build resumes, and
            accelerate hiring decisions.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Quick links</p>
          <ul className="mt-2 space-y-2">
            <li>
              <Link href="/jobs" className="hover:text-slate-900">
                Open circulars
              </Link>
            </li>
            <li>
              <Link href="/dashboard/profile" className="hover:text-slate-900">
                Applicant profile
              </Link>
            </li>
            <li>
              <Link href="/dashboard/recruiter" className="hover:text-slate-900">
                Recruiter dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Contact</p>
          <p className="mt-2">Email: careers@devspark.example</p>
          <p>Address: Banani, Dhaka</p>
          <p className="mt-4 text-xs text-slate-500">University project template, 2026</p>
        </div>
      </div>
    </footer>
  );
}
