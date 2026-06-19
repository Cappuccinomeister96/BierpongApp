/** Erste Zeile aus einer Supabase-RPC-Antwort (mal Array, mal Einzelobjekt). */
export function firstRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
}

/** True, wenn der Browser offline ist (SSR-sicher). */
export function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
