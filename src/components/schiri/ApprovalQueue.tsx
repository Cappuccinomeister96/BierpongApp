"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MatchDetailed } from "@/lib/types";
import type { DashboardData } from "./Dashboard";

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
}: {
  match: MatchDetailed;
  reload: () => Promise<void>;
}) {
  const supabase = createClient();
  const [winner, setWinner] = useState(match.winner_id);
  const [busy, setBusy] = useState(false);

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

  const reportedName =
    match.winner_id === match.team_a_id ? match.team_a_name : match.team_b_name;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-faint">
        <span>{match.table_name ?? "Ohne Tisch"}</span>
        <span>{timeAgo(match.created_at)}</span>
      </div>
      <p className="mb-2 text-xs text-muted">
        Sieger wählen · gemeldet:{" "}
        <span className="font-medium text-ink">{reportedName}</span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: match.team_a_id, name: match.team_a_name },
          { id: match.team_b_id, name: match.team_b_name },
        ].map((t) => {
          const active = winner === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setWinner(t.id)}
              disabled={busy}
              className={`min-h-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-positive bg-positive/10 text-positive"
                  : "border-line hover:bg-inset"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={approve} disabled={busy} className="btn-positive flex-1">
          Bestätigen
        </button>
        <button
          onClick={reject}
          disabled={busy}
          className="btn-secondary !text-negative"
        >
          Ablehnen
        </button>
      </div>
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

  return (
    <div className="space-y-6">
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
              <PendingCard key={m.id} match={m} reload={reload} />
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
            {data.recent.map((m) => {
              const winnerName =
                m.winner_id === m.team_a_id ? m.team_a_name : m.team_b_name;
              return (
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
                        {winnerName}
                      </span>
                    ) : (
                      <span className="ml-2 font-medium text-negative">
                        abgelehnt
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => revert(m.id)}
                    className="shrink-0 text-xs font-medium text-accent"
                  >
                    rückgängig
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
