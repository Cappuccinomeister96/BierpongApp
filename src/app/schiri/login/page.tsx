"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInWithPassword } from "./actions";
import { ErrorNote } from "@/components/ui";
import { LockIcon, ChevronLeftIcon } from "@/components/icons";

type Phase = "password" | "totp";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/schiri";

  const [phase, setPhase] = useState<Phase>(
    params.get("step") === "mfa" ? "totp" : "password",
  );
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Beim Einstieg in die TOTP-Phase: Factor laden + Challenge starten
  useEffect(() => {
    if (phase !== "totp") return;
    let cancelled = false;
    async function setup() {
      const { data: factors, error: fErr } =
        await supabase.auth.mfa.listFactors();
      if (fErr || !factors?.totp?.length) {
        if (!cancelled)
          setError(
            "MFA nicht eingerichtet. Bitte Schiri-Admin kontaktieren.",
          );
        return;
      }
      const fid = factors.totp[0].id;
      const { data: challenge, error: cErr } =
        await supabase.auth.mfa.challenge({ factorId: fid });
      if (cErr || !challenge) {
        if (!cancelled)
          setError("MFA-Herausforderung fehlgeschlagen. Bitte Seite neu laden.");
        return;
      }
      if (!cancelled) {
        setFactorId(fid);
        setChallengeId(challenge.id);
      }
    }
    setup();
    return () => {
      cancelled = true;
    };
  }, [phase, supabase]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signInWithPassword(pin);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsMFA) {
      setPhase("totp");
    } else {
      router.replace(redirect);
      router.refresh();
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId) return;
    setError(null);
    setLoading(true);
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: otp.trim(),
    });
    setLoading(false);
    if (vErr) {
      setError("Falscher Code. Bitte erneut versuchen.");
      setOtp("");
      const { data: newChallenge } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (newChallenge) setChallengeId(newChallenge.id);
      return;
    }
    router.replace(redirect);
    router.refresh();
  }

  if (phase === "totp") {
    return (
      <div className="flex min-h-full items-center justify-center px-5 py-10">
        <form
          onSubmit={handleOtp}
          className="card w-full max-w-sm space-y-5 p-6"
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-inset text-ink">
              <LockIcon size={22} />
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight">
              2-Faktor-Verifizierung
            </h1>
            <p className="mt-1 text-[15px] text-muted">
              Code aus der Authenticator-App eingeben.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="otp-code">
              Verifizierungscode
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="input text-center tracking-widest"
              disabled={!challengeId}
            />
          </div>

          {error ? <ErrorNote>{error}</ErrorNote> : null}

          <button
            type="submit"
            disabled={loading || otp.length < 6 || !challengeId}
            className="btn-primary w-full"
          >
            {loading ? "Prüfe…" : "Bestätigen"}
          </button>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              setPhase("password");
              setOtp("");
              setError(null);
              setFactorId(null);
              setChallengeId(null);
            }}
            className="-mt-1 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ChevronLeftIcon size={18} />
            Abmelden und neu anmelden
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <form
        onSubmit={handlePassword}
        className="card w-full max-w-sm space-y-5 p-6"
      >
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
