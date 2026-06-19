type LeaderboardTableRow = {
  team_id?: string;
  team: string;
  vorname1?: string;
  vorname2?: string;
  games: number;
  wins: number;
  losses: number;
  points: number;
  rank: number;
};

/**
 * Gemeinsame Leaderboard-Tabelle.
 *  - showPlayers: zusätzliche Spalte mit den Vornamen (Schiri-Ansicht).
 *  - highlightTop: Plätze 1–3 als dunkle Badge hervorheben (öffentliche Ansicht).
 */
export function LeaderboardTable({
  rows,
  showPlayers = false,
  highlightTop = false,
}: {
  rows: LeaderboardTableRow[];
  showPlayers?: boolean;
  highlightTop?: boolean;
}) {
  return (
    <div className="card divide-y divide-line overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-faint sm:px-5">
        <span className="w-7 shrink-0">#</span>
        <span className="flex-1">Team</span>
        {showPlayers ? (
          <span className="hidden w-40 sm:block">Spieler</span>
        ) : null}
        <span className="w-9 text-center">Sp</span>
        <span className="w-9 text-center">S</span>
        <span className="w-9 text-center">N</span>
        <span className="w-14 text-right">Punkte</span>
      </div>
      {rows.map((r) => {
        const top = highlightTop && r.rank <= 3;
        return (
          <div
            key={r.team_id ?? r.team}
            className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
          >
            {highlightTop ? (
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums ${
                  top ? "bg-ink text-card" : "bg-inset text-muted"
                }`}
              >
                {r.rank}
              </span>
            ) : (
              <span className="w-7 shrink-0 font-semibold tabular-nums">
                {r.rank}
              </span>
            )}
            <span className="flex-1 truncate text-[15px] font-medium tracking-tight">
              {r.team}
            </span>
            {showPlayers ? (
              <span className="hidden w-40 truncate text-sm text-muted sm:block">
                {r.vorname1} &amp; {r.vorname2}
              </span>
            ) : null}
            <span className="w-9 text-center tabular-nums text-muted">
              {r.games}
            </span>
            <span className="w-9 text-center tabular-nums text-positive">
              {r.wins}
            </span>
            <span className="w-9 text-center tabular-nums text-negative">
              {r.losses}
            </span>
            <span className="w-14 text-right text-lg font-semibold tabular-nums">
              {r.points}
            </span>
          </div>
        );
      })}
    </div>
  );
}
