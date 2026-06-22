"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorNote } from "@/components/ui";
import { LockIcon, ChevronLeftIcon } from "@/components/icons";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/schiri";

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: process.env.NEXT_PUBLIC_SCHIRI_EMAIL!,
      password: pin,
    });
    if (error) {
      setLoading(false);
      setError("Falsches Passwort. Bitte erneut versuchen.");
      return;
    }
    router.replace(redirect);
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-inset text-ink">
            <LockIcon size={22} />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            Schiedsrichter
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            Bitte das Schiri-Passwort eingeben.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="schiri-pw">
            Passwort
          </label>
          <input
            id="schiri-pw"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Passwort eingeben"
            className="input"
          />
        </div>

        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Anmelden…" : "Anmelden"}
        </button>

        <Link
          href="/"
          className="-mt-1 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted transition hover:text-ink active:scale-[0.98]"
        >
          <ChevronLeftIcon size={18} />
          Zurück zur Startseite
        </Link>
      </form>
    </div>
  );
}

export default function SchiriLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
