import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/schiri/Dashboard";

export const metadata = { title: "Schiri-Dashboard – Bierpong" };

export default async function SchiriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Die Middleware leitet nicht-eingeloggte Nutzer bereits um; hier nur Fallback.
  return <Dashboard email={user?.email ?? ""} />;
}
