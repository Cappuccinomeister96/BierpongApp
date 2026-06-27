import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import { firstRow } from "@/lib/util";

/** Cache-Tag, über den sich alle Tisch-Auflösungen gezielt invalidieren lassen
 *  (revalidateTag("tables")), falls ein Tisch umbenannt/neu angelegt wird. */
export const TABLES_TAG = "tables";

/** Wie lange Token→Tischname gecacht wird. Tischnamen ändern sich während eines
 *  Turniers praktisch nie; nach Ablauf erneuert Next im Hintergrund (ISR). */
const TABLE_NAME_TTL_SECONDS = 3600;

/**
 * Löst den Tisch-Token zum Anzeigenamen auf – serverseitig gecacht, damit nicht
 * jeder QR-Scan die Function kalt startet und Supabase trifft. Geteilt über alle
 * Gäste: der erste Scan eines Tokens füllt den Cache, alle weiteren lesen ihn.
 *
 * Gibt null zurück, wenn der Token unbekannt/inaktiv ist (dieser Fall wird mit
 * gecacht, da er sich nicht ändert). Echte Fehler (DB nicht erreichbar o. Ä.)
 * werfen bewusst, damit kein transienter Ausfall als "unbekannt" zementiert
 * wird – der Aufrufer behandelt den Wurf wie einen unbekannten Token.
 */
export function getTableName(token: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const supabase = createAnonClient();
      const { data, error } = await supabase.rpc("get_table", {
        p_token: token,
      });
      if (error) throw error;
      return firstRow<{ name: string }>(data)?.name ?? null;
    },
    ["table-name", token],
    { tags: [TABLES_TAG], revalidate: TABLE_NAME_TTL_SECONDS },
  )();
}
