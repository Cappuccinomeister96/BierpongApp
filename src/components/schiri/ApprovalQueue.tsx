"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WinnerPicker } from "@/components/ui";
import { PlusIcon, ChevronDownIcon } from "@/components/icons";
import type { MatchDetailed } from "@/lib/types";
import type { DashboardData } from "./Dashboard";

/**
 * Schiri legt selbst ein Spiel an (#5). Solche Spiele zählen sofort
 * (status "approved") – ohne Umweg über die Freigabe-Queue.
 */
function CreateMatch({
  data,
  reload,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [winner, setWinner] = useState<string | null>(null);
  const [tableId, setTableId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const teams = data.teams.filter((t) => t.status === "green" && !t.hidden);
  const tables = data.tables.filter((t) => t.active);
  const teamA = teams.find((t) => t.id === teamAId) ?? null;
  const teamB = teams.find((t) => t.id === teamBId) ?? null;
  const winnerOptions = [teamA, teamB].filter(Boolean) as {
    id: string;
    name: string;
  }[];

  function resetForm() {
    setTeamAId("");
    setTeamBId("");
    setWinner(null);
    setTableId("");
    setErr(null);
  }

  async function create() {
    setErr(null);
    if (!teamAId || !teamBId || teamAId === teamBId) {
      setErr("Bitte zwei verschiedene Teams wählen.");
      return;
    }
    if (!winner) {
      setErr("Bitte den Sieger wählen.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("matches").insert({
      team_a_id: teamAId,
      team_b_id: teamBId,
      winner_id: winner,
      table_id: tableId || null,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) {
      setErr("Anlegen fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    resetForm();
    setOpen(false);
    await reload();
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <PlusIcon size={18} /> Spiel anlegen
        </span>
        <ChevronDownIcon
          className={`text-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line px-4 py-4">
          {teams.length < 2 ? (
            <p className="text-sm text-muted">
              Mindestens zwei bestätigte Teams nötig.
            </p>
          ) : (
            <>
              <div>
                <label className="label">Team A</label>
                <select
                  value={teamAId}
                  onChange={(e) => {
                    setTeamAId(e.target.value);
                    setWinner(null);
                  }}
                  className="input"
                >
                  <option value="">Team wählen…</option>
                  {teams
                    .filter((t) => t.id !== teamBId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label">Team B</label>
                <select
                  value={teamBId}
                  onChange={(e) => {
                    setTeamBId(e.target.value);
                    setWinner(null);
                  }}
                  className="input"
                >
                  <option value="">Team wählen…</option>
                  {teams
                    .filter((t) => t.id !== teamAId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </div>

              {teamA && teamB ? (
                <div>
                  <label className="label">Sieger</label>
                  <WinnerPicker
                    options={winnerOptions}
                    value={winner}
                    onChange={setWinner}
                    disabled={busy}
                  />
                </div>
              ) : null}

              {tables.length > 0 ? (
                <div>
                  <label className="label">Tisch (optional)</label>
                  <select
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                    className="input"
                  >
                    <option value="">Ohne Tisch</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {err ? (
                <p className="text-sm font-medium text-negative">{err}</p>
              ) : null}

              <button
                onClick={create}
                disabled={busy}
                className="btn-positive w-full"
              >
                Spiel anlegen (zählt sofort)
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  return `vor ${h} h`;
}

function PendingCard({
  match,
  reload,
  duplicate,
}: {
  match: MatchDetailed;
  reload: () => Promise<void>;
  duplicate?: boolean;
}) {
  const supabase = createClient();
  const [winner, setWinner] = useState(match.winner_id);
  const [busy, setBusy] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);

  async function approve() {
    setBusy(true);
    await supabase
      .from("matches")
      .update({
        status: "approved",
        winner_id: winner,
        approved_at: new Date().toISOString(),
      })
      .eq("id", match.id);
    await reload();
  }

  async function reject() {
    setBusy(true);
    await supabase.from("matches").update({ status: "rejected" }).eq("id", match.id);
    await reload();
  }

  return (
    <div className={`card p-4 ${duplicate ? "ring-1 ring-negative/30" : ""}`}>
      <div className="mb-3 flex items-center justify-between text-xs text-faint">
        <span>{match.table_name ?? "Ohne Tisch"}</span>
        <span>{timeAgo(match.created_at)}</span>
      </div>
      {duplicate ? (
        <p className="mb-2 rounded-lg bg-negative/10 px-3 py-1.5 text-xs font-medium text-negative">
          Mögliches Duplikat – dieselbe Paarung kommt mehrfach vor
        </p>
      ) : null}
      <p className="mb-2 text-xs text-muted">
        Sieger wählen · gemeldet:{" "}
        <span className="font-medium text-ink">{match.winner_name}</span>
      </p>
      <WinnerPicker
        options={[
          { id: match.team_a_id, name: match.team_a_name },
          { id: match.team_b_id, name: match.team_b_name },
        ]}
        value={winner}
        onChange={setWinner}
        disabled={busy}
      />
      {confirmingReject ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-negative">
            Spiel wirklich ablehnen?
          </p>
          <div className="flex gap-2">
            <button
              onClick={reject}
              disabled={busy}
              className="btn flex-1 bg-negative text-sm text-white hover:brightness-95"
            >
              Ja, ablehnen
            </button>
            <button
              onClick={() => setConfirmingReject(false)}
              disabled={busy}
              className="btn-secondary flex-1 text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button onClick={approve} disabled={busy} className="btn-positive flex-1">
            Bestätigen
          </button>
          <button
            onClick={() => setConfirmingReject(true)}
            disabled={busy}
            className="btn-secondary !text-negative"
          >
            Ablehnen
          </button>
        </div>
      )}
    </div>
  );
}

export function ApprovalQueue({
  data,
  reload,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
}) {
  const supabase = createClient();

  async function revert(id: string) {
    await supabase
      .from("matches")
      .update({ status: "pending", approved_at: null })
      .eq("id", id);
    await reload();
  }

  // Paarungen markieren, die mehrfach in der Queue stehen (mögliche Duplikate)
  const pairCount = new Map<string, number>();
  for (const m of data.pending) {
    const key = [m.team_a_id, m.team_b_id].sort().join("|");
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }
  const isDuplicate = (m: MatchDetailed) =>
    (pairCount.get([m.team_a_id, m.team_b_id].sort().join("|")) ?? 0) > 1;

  return (
    <div className="space-y-6">
      <CreateMatch data={data} reload={reload} />

      <section>
        <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-faint">
          Wartet auf Freigabe ({data.pending.length})
        </h2>
        {data.pending.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            Keine offenen Spiele.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.pending.map((m) => (
              <PendingCard
                key={m.id}
                match={m}
                reload={reload}
                duplicate={isDuplicate(m)}
              />
            ))}
          </div>
        )}
      </section>

      {data.recent.length > 0 ? (
        <section>
          <h2 className="mb-3 px-1 text-xs font-medium uppercase tracking-wider text-faint">
            Zuletzt entschieden
          </h2>
          <div className="card divide-y divide-line overflow-hidden">
            {data.recent.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <span className="text-muted">
                      {m.team_a_name} – {m.team_b_name}
                    </span>
                    {m.status === "approved" ? (
                      <span className="ml-2 font-medium text-positive">
                        {m.winner_name}
                      </span>
                    ) : (
                      <span className="ml-2 font-medium text-negative">
                        abgelehnt
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => revert(m.id)}
                    className="-m-2 shrink-0 p-2 text-xs font-medium text-accent"
                  >
                    rückgängig
                  </button>
                </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
