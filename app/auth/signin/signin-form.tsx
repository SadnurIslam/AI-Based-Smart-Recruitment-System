"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useMemo, useState } from "react";

type SignInFormProps = {
  googleEnabled: boolean;
};

export function SignInForm({ googleEnabled }: SignInFormProps) {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = useMemo(() => params.get("callbackUrl") || "/dashboard", [params]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (response?.error) {
      setError("Invalid credentials. Please check email and password.");
      setLoading(false);
      return;
    }

    router.push(response?.url || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="input-field"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="input-field"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      {error || params.get("error") ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error || "Authentication failed. Please try again."}
        </p>
      ) : null}

      <button type="submit" className="btn-main w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {googleEnabled ? (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-soft w-full"
        >
          Continue with Gmail
        </button>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Gmail login appears automatically after adding GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
        </p>
      )}
    </form>
  );
}
