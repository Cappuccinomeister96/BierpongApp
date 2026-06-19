import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmTeam } from "@/components/ConfirmTeam";

export const metadata = { title: "Team bestätigen – Bierpong" };

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Die Middleware stellt sicher, dass nur eingeloggte Schiris hierher gelangen.
  // Hier wird NICHT automatisch bestätigt – das übernimmt der Schiri per Klick.
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, vorname1, vorname2, status")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!team) {
    return (
      <div className="flex min-h-full items-center justify-center px-5 py-10">
        <div className="card w-full max-w-sm space-y-4 p-6 text-center">
          <h1 className="text-xl font-semibold tracking-tight">
            Team nicht gefunden
          </h1>
          <p className="text-[15px] text-muted">
            Dieser Bestätigungs-Code ist ungültig.
          </p>
          <Link href="/schiri" className="btn-primary w-full">
            Zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <ConfirmTeam team={team} />;
}
