"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrigin } from "@/lib/useOrigin";
import { firstRow, isOffline } from "@/lib/util";
import { Card } from "@/components/PlayerShell";
import { Rules } from "@/components/Rules";
import { QrCode } from "@/components/QrCode";
import { ErrorNote, SuccessHeader } from "@/components/ui";
import { ChevronDownIcon } from "@/components/icons";

type Success = { teamName: string; confirmToken: string };

export function AnmeldeForm() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [vorname1, setVorname1] = useState("");
  const [vorname2, setVorname2] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showRules, setShowRules] = useState(true);

  const [points, setPoints] = useState({ sieg: 3, niederlage: -1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const origin = useOrigin();

  useEffect(() => {
    supabase
      .from("config")
      .select("sieg_punkte, niederlage_punkte")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data)
          setPoints({ sieg: data.sieg_punkte, niederlage: data.niederlage_punkte });
      });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Bitte bestätige, dass ihr die Regeln kennt.");
      return;
    }
    if (isOffline()) {
      setError("Keine Internetverbindung. Bitte Netz prüfen und erneut versuchen.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("register_team", {
        p_name: name,
        p_vorname1: vorname1,
        p_vorname2: vorname2,
      });
      if (error) {
        setError(error.message || "Anmeldung fehlgeschlagen. Bitte nochmal versuchen.");
        return;
      }
      const row = firstRow(data);
      if (!row?.confirm_token) {
        setError("Unerwartete Antwort. Bitte beim Schiedsrichter melden.");
        return;
      }
      setSuccess({ teamName: name.trim(), confirmToken: row.confirm_token });
    } catch {
      setError("Verbindungsproblem. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const confirmUrl = `${origin}/schiri/confirm/${success.confirmToken}`;
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center text-center">
          <SuccessHeader title="Team angemeldet">
            <span className="font-medium text-ink">{success.teamName}</span>{" "}
            wartet auf die Bestätigung des Schiedsrichters.
          </SuccessHeader>
        </Card>

        <Card className="flex flex-col items-center text-center">
          <p className="text-[15px] font-medium">
            Diesen Code dem Schiedsrichter zeigen
          </p>
          <p className="mb-4 mt-1 text-sm text-muted">
            Er scannt ihn und gibt euch frei – dann dürft ihr spielen.
          </p>
          <div className="rounded-2xl border border-line p-3">
            <QrCode value={confirmUrl} size={232} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="px-1 pb-1">
        <h1 className="text-3xl font-semibold tracking-tight">Team anmelden</h1>
        <p className="mt-2 text-[15px] text-muted">
          Ein Spieler meldet das Team an. Danach kurz dem Schiedsrichter zeigen.
        </p>
      </div>

      <Card className="!p-0">
        <button
          type="button"
          onClick={() => setShowRules((s) => !s)}
          className="flex w-full items-center justify-between px-5 py-4 text-[15px] font-semibold"
        >
          Regeln
          <ChevronDownIcon
            className={`text-faint transition-transform ${showRules ? "rotate-180" : ""}`}
          />
        </button>
        {showRules ? (
          <div className="border-t border-line px-5 py-4">
            <Rules siegPunkte={points.sieg} niederlagePunkte={points.niederlage} />
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4">
        <div>
          <label className="label">Teamname</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            placeholder="z. B. Die Bierbarone"
            className="input"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Vorname 1</label>
            <input
              value={vorname1}
              onChange={(e) => setVorname1(e.target.value)}
              required
              maxLength={30}
              placeholder="Vorname"
              className="input"
            />
          </div>
          <div>
            <label className="label">Vorname 2</label>
            <input
              value={vorname2}
              onChange={(e) => setVorname2(e.target.value)}
              required
              maxLength={30}
              placeholder="Vorname"
              className="input"
            />
          </div>
        </div>

        <label className="flex items-start gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded accent-[var(--color-accent)]"
          />
          <span>Wir kennen die Regeln und spielen fair.</span>
        </label>

        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Wird angemeldet…" : "Team anmelden"}
        </button>
      </Card>
    </form>
  );
}
