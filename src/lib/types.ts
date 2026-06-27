export type TeamStatus = "yellow" | "green";
export type MatchStatus = "pending" | "approved" | "rejected";

export type Config = {
  id: number;
  tournament_name: string;
  sieg_punkte: number;
  niederlage_punkte: number;
  max_teams: number;
  /** Endzeit des Turniers im Format hh:mm (oder null, wenn nicht gesetzt). */
  end_time: string | null;
  /** Uhrzeit der Siegerehrung im Format hh:mm (oder null, wenn nicht gesetzt). */
  siegerehrung_time: string | null;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  vorname1: string;
  vorname2: string;
  status: TeamStatus;
  hidden: boolean;
  confirm_token: string;
  created_by: "player" | "referee";
  created_at: string;
};

/** Öffentlich sichtbare Team-Daten (View teams_public) – ohne Vornamen. */
export type PublicTeam = {
  id: string;
  name: string;
};

/** Antwort der RPC submit_match. Bei `duplicate` existiert bereits eine offene
 *  Meldung derselben Paarung – die Namen/Tisch stammen aus dieser Originalmeldung. */
export type SubmitMatchResult = {
  match_id: string;
  duplicate: boolean;
  team_a_name?: string;
  team_b_name?: string;
  winner_name?: string;
  table_name?: string | null;
};

export type TableRow = {
  id: string;
  name: string;
  token: string;
  active: boolean;
  created_at: string;
};

export type Match = {
  id: string;
  table_id: string | null;
  team_a_id: string;
  team_b_id: string;
  winner_id: string;
  status: MatchStatus;
  note: string | null;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
};

/** Match angereichert mit Team-/Tischnamen (für das Schiri-Dashboard). */
export type MatchDetailed = Match & {
  team_a_name: string;
  team_b_name: string;
  winner_name: string;
  table_name: string | null;
};

/** Zeile des Schiri-Leaderboards (inkl. Spieler). */
export type LeaderboardRow = {
  team_id: string;
  team: string;
  vorname1: string;
  vorname2: string;
  games: number;
  wins: number;
  losses: number;
  points: number;
  rank: number;
};

/** Zeile des öffentlichen Leaderboards (nur Teamname). */
export type PublicLeaderboardRow = {
  team: string;
  games: number;
  wins: number;
  losses: number;
  points: number;
  rank: number;
};
