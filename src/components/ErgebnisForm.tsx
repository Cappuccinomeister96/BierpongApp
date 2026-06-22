"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isOffline } from "@/lib/util";
import { Card } from "@/components/PlayerShell";
import { ErrorNote, SuccessHeader, WinnerPicker } from "@/components/ui";
import type { PublicTeam } from "@/lib/types";

function TeamPicker({
  label,
  teams,
  value,
  onChange,
  excludeId,
}: {
  label: string;
  teams: PublicTeam[];
  value: PublicTeam | null;
  onChange: (t: PublicTeam | null) => void;
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return teams
      .filter((t) => t.id !== excludeId)
      .filter((t) => (q ? t.name.toLowerCase().includes(q) : true))
      .slice(0, 30);
  }, [teams, query, excludeId]);

  if (value) {
    return (
      <div>
        <label className="label">{label}</label>
        <div className="flex items-center justify-between rounded-xl border border-accent bg-accent/5 px-3.5 py-3">
          <span className="font-medium">{value.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="-m-2 p-2 text-sm font-medium text-accent"
          >
            ändern
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <label className="label">{label}</label>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Teamname suchen…"
        className="input"
      />
      {open ? (
        <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-line bg-card">
          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-muted">Kein Team gefunden.</p>
          ) : (
            filtered.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className="block w-full border-b border-line px-3.5 py-3 text-left last:border-0 hover:bg-inset"
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ErgebnisForm({
  tableToken,
  tableName,
}: {
  tableToken: string;
  tableName: string | null;
}) {
  const supabase = createClient();

  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamA, setTeamA] = useState<PublicTeam | null>(null);
  const [teamB, setTeamB] = useState<PublicTeam | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function loadTeams() {
    setLoading(true);
    const { data } = await supabase
      .from("teams_public")
      .select("id, name")
      .order("name");
    setTeams((data as PublicTeam[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!teamA || !teamB) {
      setError("Bitte beide Teams wählen.");
      return;
    }
    if (!winnerId) {
      setError("Bitte den Sieger wählen.");
      return;
    }
    if (isOffline()) {
      setError("Keine Internetverbindung. Bitte Netz prüfen und erneut senden.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_match", {
        p_table_token: tableToken,
        p_team_a: teamA.id,
        p_team_b: teamB.id,
        p_winner: winnerId,
      });
      if (error) {
        setError(error.message || "Konnte nicht gespeichert werden. Bitte nochmal.");
        return;
      }
      setDone(true);
    } catch {
      setError("Verbindungsproblem. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setTeamA(null);
    setTeamB(null);
    setWinnerId(null);
    setError(null);
    setDone(false);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Card className="flex flex-col items-center text-center">
          <SuccessHeader title="Ergebnis gemeldet">
            Der Schiedsrichter bestätigt das Spiel gleich. Erst dann zählen die
            Punkte.
          </SuccessHeader>
        </Card>
        <button onClick={reset} className="btn-primary w-full">
          Nächstes Ergebnis eintragen
        </button>
      </div>
    );
  }

  const winnerOptions = [teamA, teamB].filter(Boolean) as PublicTeam[];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="px-1 pb-1">
        <h1 className="text-3xl font-semibold tracking-tight">Ergebnis</h1>
        <p className="mt-2 text-[15px] text-muted">
          {tableName ? (
            <>
              Tisch <span className="font-medium text-ink">{tableName}</span>.{" "}
            </>
          ) : null}
          Wählt beide Teams und den Sieger.
        </p>
      </div>

      <Card className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted">Teams werden geladen…</p>
        ) : teams.length === 0 ? (
          <p className="text-[15px] text-muted">
            Noch keine bestätigten Teams. Erst beim Schiedsrichter anmelden
            lassen.
          </p>
        ) : (
          <>
            <TeamPicker
              label="Team A"
              teams={teams}
              value={teamA}
              onChange={(t) => {
                setTeamA(t);
                setWinnerId(null);
              }}
              excludeId={teamB?.id}
            />
            <TeamPicker
              label="Team B"
              teams={teams}
              value={teamB}
              onChange={(t) => {
                setTeamB(t);
                setWinnerId(null);
              }}
              excludeId={teamA?.id}
            />

            {teamA && teamB ? (
              <div>
                <label className="label">Sieger</label>
                <WinnerPicker
                  options={winnerOptions}
                  value={winnerId}
                  onChange={setWinnerId}
                />
              </div>
            ) : null}
          </>
        )}

        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <button
          type="submit"
          disabled={submitting || loading || teams.length === 0}
          className="btn-primary w-full"
        >
          {submitting ? "Wird gesendet…" : "Ergebnis melden"}
        </button>
      </Card>
    </form>
  );
}
