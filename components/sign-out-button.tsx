"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full border border-amber-300/60 px-4 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-100"
    >
      Sign out
    </button>
  );
}
