"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type {
  Config,
  LeaderboardRow,
  MatchDetailed,
  TableRow,
  Team,
} from "@/lib/types";
import { ApprovalQueue } from "./ApprovalQueue";
import { TeamsTab } from "./TeamsTab";
import { TablesTab } from "./TablesTab";
import { ConfigTab } from "./ConfigTab";
import { SchiriLeaderboard } from "./SchiriLeaderboard";

type Tab = "queue" | "teams" | "leaderboard" | "tables" | "config";

export type DashboardData = {
  pending: MatchDetailed[];
  recent: MatchDetailed[];
  teams: Team[];
  tables: TableRow[];
  config: Config | null;
  leaderboard: LeaderboardRow[];
};

export function Dashboard({ email }: { email: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("queue");
  const [data, setData] = useState<DashboardData>({
    pending: [],
    recent: [],
    teams: [],
    tables: [],
    config: null,
    leaderboard: [],
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [pending, recent, teams, tables, config, leaderboard] =
      await Promise.all([
        supabase
          .from("matches_detailed")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
        supabase
          .from("matches_detailed")
          .select("*")
          .neq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase.from("teams").select("*").order("created_at", { ascending: false }),
        supabase.from("tables").select("*").order("created_at", { ascending: true }),
        supabase.from("config").select("*").eq("id", 1).single(),
        supabase.from("leaderboard_view").select("*"),
      ]);

    setData({
      pending: (pending.data as MatchDetailed[]) ?? [],
      recent: (recent.data as MatchDetailed[]) ?? [],
      teams: (teams.data as Team[]) ?? [],
      tables: (tables.data as TableRow[]) ?? [],
      config: (config.data as Config) ?? null,
      leaderboard: ((leaderboard.data as LeaderboardRow[]) ?? []).sort(
        (a, b) => a.rank - b.rank,
      ),
    });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    reload();
    const channel = supabase
      .channel("schiri-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => reload(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => reload(),
      )
      .subscribe();
    const interval = setInterval(reload, 30_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [supabase, reload]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/schiri/login");
    router.refresh();
  }

  const yellowCount = data.teams.filter((t) => t.status === "yellow").length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "queue", label: "Freigabe", badge: data.pending.length },
    { id: "teams", label: "Teams", badge: yellowCount },
    { id: "leaderboard", label: "Tabelle" },
    { id: "tables", label: "Tische" },
    { id: "config", label: "Config" },
  ];

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-[15px] font-semibold tracking-tight">
              Schiedsrichter
            </div>
            <div className="text-xs text-faint">{email}</div>
          </div>
          <button onClick={logout} className="btn-secondary btn-sm">
            Abmelden
          </button>
        </div>
        <div className="mx-auto w-full max-w-5xl px-2 pb-2">
          <nav className="flex gap-1 overflow-x-auto rounded-xl bg-inset p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  tab === t.id
                    ? "bg-card text-ink shadow-card"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {t.badge ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        {loading ? (
          <p className="text-muted">Lädt…</p>
        ) : tab === "queue" ? (
          <ApprovalQueue data={data} reload={reload} />
        ) : tab === "teams" ? (
          <TeamsTab data={data} reload={reload} />
        ) : tab === "leaderboard" ? (
          <SchiriLeaderboard data={data} />
        ) : tab === "tables" ? (
          <TablesTab data={data} reload={reload} />
        ) : (
          <ConfigTab data={data} reload={reload} />
        )}
      </main>
    </div>
  );
}
