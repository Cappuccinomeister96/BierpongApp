"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorNote } from "@/components/ui";
import { LockIcon, ChevronLeftIcon } from "@/components/icons";

type PageState =
  | { phase: "loading" }
  | { phase: "not-enrolled" }
  | {
      phase: "enrolling";
      factorId: string;
      qr: string;
      secret: string;
      challengeId: string | null;
    }
  | { phase: "enrolled"; factorId: string }
  | { phase: "done" };

export default function MFASetupPage() {
  const supabase = createClient();
  const router = useRouter();
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checkEnrollment = useCallback(async () => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors?.totp?.length) {
      setState({ phase: "enrolled", factorId: factors.totp[0].id });
    } else {
      setState({ phase: "not-enrolled" });
    }
  }, [supabase]);

  useEffect(() => {
    checkEnrollment();
  }, [checkEnrollment]);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    const { data, error: eErr } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "Bierpong-Schiri",
      friendlyName: "Schiri-App",
    });
    if (eErr || !data) {
      setError("Einrichtung fehlgeschlagen: " + eErr?.message);
      setBusy(false);
      return;
    }
    const enrollState: PageState = {
      phase: "enrolling",
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
      challengeId: null,
    };
    setState(enrollState);
    setBusy(false);

    const { data: challenge } = await supabase.auth.mfa.challenge({
      factorId: data.id,
    });
    if (challenge) {
      setState((prev) =>
        prev.phase === "enrolling"
          ? { ...prev, challengeId: challenge.id }
          : prev,
      );
    }
  }

  async function verifyEnroll() {
    if (state.phase !== "enrolling" || !state.challengeId) return;
    setBusy(true);
    setError(null);
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: state.factorId,
      challengeId: state.challengeId,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError("Falscher Code. Bitte erneut versuchen.");
      setCode("");
      const { data: newChallenge } = await supabase.auth.mfa.challenge({
        factorId: state.factorId,
      });
      if (newChallenge) {
        setState((prev) =>
          prev.phase === "enrolling"
            ? { ...prev, challengeId: newChallenge.id }
            : prev,
        );
      }
      return;
    }
    setState({ phase: "done" });
  }

  async function unenroll() {
    if (state.phase !== "enrolled") return;
    const ok = confirm(
      "MFA wirklich deaktivieren? Der Schiri-Bereich wird danach nur noch durch das Passwort geschützt.",
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    const { error: uErr } = await supabase.auth.mfa.unenroll({
      factorId: state.factorId,
    });
    setBusy(false);
    if (uErr) {
      setError("Deaktivierung fehlgeschlagen: " + uErr.message);
      return;
    }
    setState({ phase: "not-enrolled" });
  }

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-inset text-ink">
            <LockIcon size={22} />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            2-Faktor-Authentifizierung
          </h1>
        </div>

        {state.phase === "loading" && (
          <p className="text-center text-muted">Lädt…</p>
        )}

        {state.phase === "not-enrolled" && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              MFA ist derzeit{" "}
              <strong className="text-ink">nicht aktiv</strong>. Nach der
              Einrichtung wird bei jedem Login zusätzlich ein Code aus einer
              Authenticator-App benötigt.
            </p>
            <button
              onClick={startEnroll}
              disabled={busy}
              className="btn-primary w-full"
            >
              {busy ? "Lädt…" : "MFA einrichten"}
            </button>
          </div>
        )}

        {state.phase === "enrolling" && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Scanne den QR-Code mit einer Authenticator-App (z. B. Google
              Authenticator, Authy) und gib den angezeigten 6-stelligen Code
              ein.
            </p>
            {state.qr && (
              <div
                className="mx-auto w-fit rounded-xl border border-line bg-white p-3"
                dangerouslySetInnerHTML={{ __html: state.qr }}
              />
            )}
            <details className="text-xs text-muted">
              <summary className="cursor-pointer select-none">
                Manueller Schlüssel
              </summary>
              <code className="mt-1 block break-all rounded bg-inset px-2 py-1 font-mono text-ink">
                {state.secret}
              </code>
            </details>
            <div>
              <label className="label" htmlFor="totp-setup">
                Code eingeben
              </label>
              <input
                id="totp-setup"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="input text-center tracking-widest"
                disabled={!state.challengeId}
              />
            </div>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <button
              onClick={verifyEnroll}
              disabled={busy || code.length < 6 || !state.challengeId}
              className="btn-primary w-full"
            >
              {busy ? "Prüfe…" : "Bestätigen & aktivieren"}
            </button>
          </div>
        )}

        {state.phase === "enrolled" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-positive/10 px-4 py-3 text-sm font-medium text-positive">
              MFA ist aktiv. Jeder Login erfordert Passwort + Authenticator-Code.
            </div>
            {error ? <ErrorNote>{error}</ErrorNote> : null}
            <button
              onClick={unenroll}
              disabled={busy}
              className="btn-secondary w-full !text-negative"
            >
              {busy ? "Deaktiviere…" : "MFA deaktivieren"}
            </button>
          </div>
        )}

        {state.phase === "done" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-positive/10 px-4 py-3 text-sm font-medium text-positive">
              MFA erfolgreich eingerichtet! Der Schiri-Bereich ist jetzt durch
              Passwort + Authenticator-Code geschützt.
            </div>
            <button
              onClick={() => router.replace("/schiri")}
              className="btn-primary w-full"
            >
              Zum Dashboard
            </button>
          </div>
        )}

        <Link
          href="/schiri"
          className="flex w-full items-center justify-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ChevronLeftIcon size={18} />
          Zurück zum Dashboard
        </Link>
      </div>
    </div>
  );
}
