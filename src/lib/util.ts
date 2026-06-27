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

/**
 * Übersetzt einen Supabase-RPC-Fehler in eine für Spieler verständliche Meldung.
 *
 * Nur unsere eigenen, absichtlich geworfenen Validierungsfehler tragen
 * brauchbaren Klartext: `raise exception '…'` in den RPCs liefert SQLSTATE
 * "P0001". Nur diese werden angezeigt. Alles andere (DB-interne Fehler wie
 * "column reference is ambiguous", Constraint-Verletzungen, Verbindungsabbrüche)
 * ist für den Spieler nutzlos und wird durch die neutrale Fallback-Meldung
 * ersetzt – der rohe technische Text erscheint nie im UI.
 */
export function userMessage(
  error: { code?: string; message?: string } | null,
  fallback: string,
): string {
  if (error?.code === "P0001" && error.message) return error.message;
  return fallback;
}
