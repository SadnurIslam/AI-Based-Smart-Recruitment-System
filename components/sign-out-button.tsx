"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-slate-700 px-4 py-1.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
    >
      Sign out
    </button>
  );
}
