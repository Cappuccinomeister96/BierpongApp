import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-Client für Client-Komponenten (Browser).
 * Nutzt ausschließlich den öffentlichen anon-Key – Schreibzugriffe sind durch
 * RLS/RPC serverseitig eng begrenzt.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
