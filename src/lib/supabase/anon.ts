import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-loser Supabase-Client für öffentliche, cachebare Server-Reads
 * (z. B. Token→Tischname über die anon-RPC get_table).
 *
 * Bewusst OHNE Session-Cookies: sobald eine Server-Komponente Cookies liest,
 * wird die Seite dynamisch gerendert und lässt sich nicht mehr cachen. Dieser
 * Client liest keine Session, daher bleibt die aufrufende Seite ISR-fähig.
 */
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
