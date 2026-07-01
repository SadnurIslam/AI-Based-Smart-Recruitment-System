import Link from "next/link";

import { getAuthSession } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getAuthSession();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight text-slate-100 text-lg">
          devspark <span className="text-lime-400">|</span>
        </Link>

        <nav className="hidden items-center gap-5 text-xs font-semibold tracking-widest uppercase text-slate-400 md:flex">
          <Link href="/jobs" className="transition hover:text-[#b5ff14]">
            Jobs
          </Link>
          <Link href="/careers" className="transition hover:text-[#b5ff14]">
            Careers
          </Link>
          <Link href="/about" className="transition hover:text-[#b5ff14]">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-[#b5ff14]">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full bg-[#b5ff14] px-4 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-[#a3e612]"
              >
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="rounded-full border border-slate-700 px-4 py-1.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-[#b5ff14] px-4 py-1.5 text-sm font-semibold text-slate-900 transition hover:bg-[#a3e612]"
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
