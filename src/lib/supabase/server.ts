import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-Client für Server-Komponenten / Route Handler.
 * Liest und schreibt die Auth-Session über Cookies, damit die
 * Schiedsrichter-Anmeldung das Schließen/Neuladen von Tabs übersteht.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Aufruf aus einer Server-Komponente ohne Schreibrecht auf Cookies –
            // die Session wird dann durch die Middleware aktualisiert.
          }
        },
      },
    },
  );
}
