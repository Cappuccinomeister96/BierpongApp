"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

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
 * Gemeinsame Leaderboard-Tabelle (Handy-Hochkant-optimiert).
 *  - Zeile zeigt nur Rang, vollständigen Teamnamen und Punkte.
 *  - Tippen klappt die Detailwerte (Spiele/Siege/Niederlagen, Spieler) inline auf.
 *  - showPlayers: Spielernamen im Detail anzeigen (Schiri-Ansicht).
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
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="card divide-y divide-line overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-faint sm:px-5">
        <span className="w-7 shrink-0">#</span>
        <span className="flex-1">Team</span>
        <span className="w-14 text-right">Punkte</span>
        <span className="w-5 shrink-0" />
      </div>
      {rows.map((r) => {
        const top = highlightTop && r.rank <= 3;
        const key = r.team_id ?? r.team;
        const isOpen = open.has(key);
        return (
          <div key={key} className={top ? "bg-tint/50" : ""}>
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              aria-label={`Details zu ${r.team}`}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-inset sm:px-5"
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
              <span className="flex-1 break-words text-[15px] font-medium tracking-tight">
                {r.team}
              </span>
              <span className="w-14 text-right text-lg font-semibold tabular-nums">
                {r.points}
              </span>
              <ChevronDownIcon
                size={18}
                className={`w-5 shrink-0 text-faint transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 sm:px-5">
                  {showPlayers && (r.vorname1 || r.vorname2) ? (
                    <p className="mb-3 text-sm text-muted">
                      {r.vorname1}
                      {r.vorname1 && r.vorname2 ? " & " : ""}
                      {r.vorname2}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-3 divide-x divide-line rounded-xl bg-inset py-3 text-center">
                    <Stat label="Spiele" value={r.games} />
                    <Stat label="Siege" value={r.wins} className="text-positive" />
                    <Stat
                      label="Niederlagen"
                      value={r.losses}
                      className="text-negative"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="px-2">
      <div className={`text-xl font-semibold tabular-nums ${className}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-muted">{label}</div>
    </div>
  );
}
