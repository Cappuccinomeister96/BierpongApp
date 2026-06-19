"use client";

import type { DashboardData } from "./Dashboard";

export function SchiriLeaderboard({ data }: { data: DashboardData }) {
  if (data.leaderboard.length === 0) {
    return <p className="px-1 text-muted">Noch keine bestätigten Teams.</p>;
  }

  return (
    <div className="card divide-y divide-line overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-faint">
        <span className="w-6 shrink-0">#</span>
        <span className="flex-1">Team</span>
        <span className="hidden w-40 sm:block">Spieler</span>
        <span className="w-8 text-center">Sp</span>
        <span className="w-8 text-center">S</span>
        <span className="w-8 text-center">N</span>
        <span className="w-12 text-right">Pkt</span>
      </div>
      {data.leaderboard.map((r) => (
        <div key={r.team_id} className="flex items-center gap-3 px-4 py-3 text-sm">
          <span className="w-6 shrink-0 font-semibold tabular-nums">{r.rank}</span>
          <span className="flex-1 truncate font-medium">{r.team}</span>
          <span className="hidden w-40 truncate text-muted sm:block">
            {r.vorname1} &amp; {r.vorname2}
          </span>
          <span className="w-8 text-center tabular-nums text-muted">{r.games}</span>
          <span className="w-8 text-center tabular-nums text-positive">{r.wins}</span>
          <span className="w-8 text-center tabular-nums text-negative">{r.losses}</span>
          <span className="w-12 text-right font-semibold tabular-nums">{r.points}</span>
        </div>
      ))}
    </div>
  );
}
