import Link from "next/link";

import { getAuthSession } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getAuthSession();

  return (
    <header className="sticky top-0 z-30 border-b border-amber-200/60 bg-amber-50/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-slate-900">
          DevSpark Smart Recruitment
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
          <Link href="/jobs" className="transition hover:text-slate-950">
            Jobs
          </Link>
          <Link href="/careers" className="transition hover:text-slate-950">
            Careers
          </Link>
          <Link href="/about" className="transition hover:text-slate-950">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-slate-950">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
