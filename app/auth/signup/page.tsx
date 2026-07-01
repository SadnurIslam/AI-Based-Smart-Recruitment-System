import Link from "next/link";

import { SignUpForm } from "@/app/auth/signup/signup-form";

export default function SignUpPage() {
  return (
    <section className="section-shell">
      <div className="mx-auto max-w-2xl rounded-3xl p-8 md:p-10 glass-panel fade-up">
        <p className="tag-pill">Applicant onboarding</p>
        <h1 className="mt-4 text-4xl font-bold text-white">Create your DevSpark account</h1>
        <p className="mt-3 text-slate-300">
          Build your profile, generate AI resume, and apply to open circulars with smart matching.
        </p>

        <div className="mt-8">
          <SignUpForm />
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-semibold text-lime-400 hover:text-teal-800">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
