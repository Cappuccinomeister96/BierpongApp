"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { EventTimes } from "@/components/EventTimes";
import { ChevronLeftIcon } from "@/components/icons";
import type { PublicLeaderboardRow } from "@/lib/types";

export function PublicLeaderboard() {
  const supabase = createClient();
  const [rows, setRows] = useState<PublicLeaderboardRow[]>([]);
  const [tournamentName, setTournamentName] = useState("Bierpong-Turnier");
  const [endTime, setEndTime] = useState<string | null>(null);
  const [siegerehrung, setSiegerehrung] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const [{ data: lb }, { data: cfg }] = await Promise.all([
      supabase.from("leaderboard_public").select("*"),
      supabase
        .from("config")
        .select("tournament_name, end_time, siegerehrung_time")
        .eq("id", 1)
        .single(),
    ]);
    if (lb) {
      const sorted = [...(lb as PublicLeaderboardRow[])].sort(
        (a, b) => a.rank - b.rank,
      );
      setRows(sorted);
    }
    if (cfg?.tournament_name) setTournamentName(cfg.tournament_name);
    if (cfg) {
      setEndTime(cfg.end_time);
      setSiegerehrung(cfg.siegerehrung_time);
    }
    setUpdatedAt(new Date());
  }, [supabase]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <EventTimes
        endTime={endTime}
        siegerehrung={siegerehrung}
        className="mb-4 rounded-xl border border-line bg-tint/40 px-4 py-2"
      />
      <Link
        href="/"
        className="no-print mb-4 -ml-1 inline-flex items-center gap-1 px-1 text-sm font-medium text-muted transition hover:text-ink active:scale-[0.98]"
      >
        <ChevronLeftIcon size={18} />
        Zurück
      </Link>
      <header className="mb-6 flex items-end justify-between px-1">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-widest text-faint">
            Live-Tabelle
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {tournamentName}
          </h1>
          <p className="mt-1 text-sm font-medium text-accent">
            100 Jahre TSV Stelingen · 2026
          </p>
        </div>
        {updatedAt ? (
          <p className="text-xs tabular-nums text-faint">
            {updatedAt.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : null}
      </header>

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-muted">
          Noch keine Teams. Sobald gespielt wird, erscheint hier die Tabelle.
        </div>
      ) : (
        <LeaderboardTable rows={rows} highlightTop />
      )}
    </div>
  );
}
