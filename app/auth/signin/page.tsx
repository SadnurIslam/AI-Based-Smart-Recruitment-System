import Link from "next/link";
import { Suspense } from "react";

import { SignInForm } from "@/app/auth/signin/signin-form";

export default function SignInPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <section className="section-shell">
      <div className="mx-auto max-w-2xl rounded-3xl p-8 md:p-10 glass-panel fade-up">
        <p className="tag-pill">Welcome back</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Sign in to DevSpark</h1>
        <p className="mt-3 text-slate-300">
          Access your applicant or recruiter dashboard and continue your recruitment workflow.
        </p>

        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-slate-400">Loading sign-in options...</p>}>
            <SignInForm googleEnabled={googleEnabled} />
          </Suspense>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          New here?{" "}
          <Link href="/auth/signup" className="font-semibold text-lime-400 hover:text-teal-800">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
