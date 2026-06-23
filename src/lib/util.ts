/** Erste Zeile aus einer Supabase-RPC-Antwort (mal Array, mal Einzelobjekt). */
export function firstRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

/** True, wenn der Browser offline ist (SSR-sicher). */
export function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/** Maximale Teamnamen-Länge – damit der Name im Leaderboard (Handy-Hochkant)
 *  vollständig lesbar bleibt. Überall bei der Eingabe verwenden. */
export const MAX_TEAM_NAME = 24;
