import { PlayerShell, Card } from "@/components/PlayerShell";
import { ErgebnisForm } from "@/components/ErgebnisForm";
import { createClient } from "@/lib/supabase/server";
import { firstRow } from "@/lib/util";

export const metadata = { title: "Ergebnis eintragen – Bierpong" };

export default async function TischPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Tischname auflösen (RPC ist für anon freigegeben); bei Fehler trotzdem
  // weiterarbeiten – das Ergebnis kann auch ohne Tischzuordnung gemeldet werden.
  let tableName: string | null = null;
  let invalidToken = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_table", { p_token: token });
    const row = firstRow(data);
    if (row?.name) tableName = row.name;
    else invalidToken = true;
  } catch {
    invalidToken = true;
  }

  return (
    <PlayerShell subtitle={tableName ?? "Ergebnis"}>
      {invalidToken ? (
        <Card className="mb-4">
          <p className="text-sm text-muted">
            Hinweis: Dieser Tisch-Code ist unbekannt oder inaktiv. Du kannst das
            Ergebnis trotzdem melden – der Schiedsrichter ordnet es zu.
          </p>
        </Card>
      ) : null}
      <ErgebnisForm tableToken={token} tableName={tableName} />
    </PlayerShell>
  );
}
