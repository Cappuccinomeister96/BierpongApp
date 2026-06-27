"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { firstRow, isOffline, userMessage } from "@/lib/util";
import { Card } from "@/components/PlayerShell";
import { ErrorNote, SuccessHeader, WinnerPicker } from "@/components/ui";
import type { PublicTeam, SubmitMatchResult } from "@/lib/types";

/** Aktiver Tisch fürs Dropdown im Hauptansicht-Flow. */
type TableOption = { token: string; name: string };

/** Daten der bereits offenen Meldung für den "schon eingereicht"-Hinweis. */
type DuplicateInfo = {
  teamA: string;
  teamB: string;
  winner: string;
  table: string | null;
};

/** Wie lange der "schon eingereicht"-Hinweis stehen bleibt, bevor automatisch
 *  zurück zum Formular gewechselt wird. */
const DUPLICATE_NOTICE_MS = 6000;

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
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accent bg-accent/5 px-3.5 py-3">
          <span className="min-w-0 break-words font-medium">{value.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="-m-2 shrink-0 p-2 text-sm font-medium text-accent"
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
                className="block w-full break-words border-b border-line px-3.5 py-3 text-left last:border-0 hover:bg-inset"
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
  selectable = false,
}: {
  /** Fester Tisch (Tisch-QR-Flow). Entfällt im Dropdown-Modus. */
  tableToken?: string;
  tableName?: string | null;
  /** Hauptansicht-Flow: Tisch per Dropdown wählen statt per QR-Scan. */
  selectable?: boolean;
}) {
  const supabase = createClient();

  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamA, setTeamA] = useState<PublicTeam | null>(null);
  const [teamB, setTeamB] = useState<PublicTeam | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
  const [selectedToken, setSelectedToken] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);

  // Effektiver Tisch: im Dropdown-Modus der ausgewählte, sonst der feste.
  const effectiveToken = selectable ? selectedToken : tableToken ?? "";
  const effectiveName = selectable
    ? tableOptions.find((t) => t.token === selectedToken)?.name ?? null
    : tableName ?? null;

  async function loadTeams() {
    setLoading(true);
    const { data } = await supabase
      .from("teams_public")
      .select("id, name")
      .order("name");
    setTeams((data as PublicTeam[]) ?? []);
    setLoading(false);
  }

  async function loadTables() {
    const { data } = await supabase.rpc("list_active_tables");
    setTableOptions((data as TableOption[]) ?? []);
  }

  useEffect(() => {
    loadTeams();
    if (selectable) loadTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selectable && !selectedToken) {
      setError("Bitte einen Tisch wählen.");
      return;
    }
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
      const { data, error } = await supabase.rpc("submit_match", {
        p_table_token: effectiveToken,
        p_team_a: teamA.id,
        p_team_b: teamB.id,
        p_winner: winnerId,
      });
      if (error) {
        setError(
          userMessage(error, "Konnte nicht gespeichert werden. Bitte nochmal."),
        );
        return;
      }
      const row = firstRow<SubmitMatchResult>(data);
      if (row?.duplicate) {
        // Es gibt bereits eine offene Meldung dieser Paarung – Namen/Tisch aus der
        // Originalmeldung verwenden, im Zweifel auf die hier gewählten zurückfallen.
        setDuplicate({
          teamA: row.team_a_name ?? teamA.name,
          teamB: row.team_b_name ?? teamB.name,
          winner: row.winner_name ?? "",
          table: row.table_name ?? effectiveName,
        });
      } else {
        setDone(true);
      }
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
    setDuplicate(null);
  }

  // "Schon eingereicht"-Hinweis nach kurzer Zeit automatisch schließen.
  useEffect(() => {
    if (!duplicate) return;
    const t = setTimeout(reset, DUPLICATE_NOTICE_MS);
    return () => clearTimeout(t);
  }, [duplicate]);

  if (duplicate) {
    return (
      <div className="space-y-4">
        <Card className="space-y-3">
          <h1 className="text-xl font-semibold tracking-tight">
            Schon eingereicht
          </h1>
          <p className="rounded-xl bg-accent/10 px-3.5 py-3 text-[15px] text-ink">
            Das Ergebnis vom Spiel{" "}
            <span className="font-medium">{duplicate.teamA}</span> gegen{" "}
            <span className="font-medium">{duplicate.teamB}</span>
            {duplicate.table ? (
              <>
                {" "}am Tisch{" "}
                <span className="font-medium">{duplicate.table}</span>
              </>
            ) : null}{" "}
            wurde bereits eingereicht
            {duplicate.winner ? (
              <>
                {" "}(gemeldeter Sieger:{" "}
                <span className="font-medium">{duplicate.winner}</span>)
              </>
            ) : null}
            . Sobald der Schiedsrichter es bestätigt hat, kann erneut ein
            Ergebnis eingereicht werden.
          </p>
        </Card>
        <button onClick={reset} className="btn-primary w-full">
          Verstanden
        </button>
      </div>
    );
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
        <Link href="/" className="btn-primary w-full">
          Zur Startseite
        </Link>
      </div>
    );
  }

  const winnerOptions = [teamA, teamB].filter(Boolean) as PublicTeam[];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="px-1 pb-1">
        <h1 className="text-3xl font-semibold tracking-tight">Ergebnis</h1>
        <p className="mt-2 text-[15px] text-muted">
          {!selectable && effectiveName ? (
            <>
              Tisch <span className="font-medium text-ink">{effectiveName}</span>.{" "}
            </>
          ) : null}
          {selectable
            ? "Wählt Tisch, beide Teams und den Sieger."
            : "Wählt beide Teams und den Sieger."}
        </p>
      </div>

      <Card className="space-y-4">
        {selectable ? (
          <div>
            <label className="label">Tisch</label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="input"
            >
              <option value="">Tisch wählen…</option>
              {tableOptions.map((t) => (
                <option key={t.token} value={t.token}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

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
