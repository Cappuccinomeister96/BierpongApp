"use client";

import { LeaderboardTable } from "@/components/LeaderboardTable";
import type { DashboardData } from "./Dashboard";

export function SchiriLeaderboard({ data }: { data: DashboardData }) {
  if (data.leaderboard.length === 0) {
    return <p className="px-1 text-muted">Noch keine bestätigten Teams.</p>;
  }

  return <LeaderboardTable rows={data.leaderboard} showPlayers />;
}
