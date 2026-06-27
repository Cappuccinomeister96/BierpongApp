import { PlayerShell, Card } from "@/components/PlayerShell";
import { ErgebnisForm } from "@/components/ErgebnisForm";
import { getTableName } from "@/lib/tables";

export const metadata = { title: "Ergebnis eintragen – Bierpong" };

// Token→Tischname ist über das Turnier praktisch statisch und wird gecacht
// (siehe getTableName). Dadurch wird die Seite als ISR ausgeliefert: nach dem
// ersten Scan eines Tokens kommt das HTML aus dem CDN – ohne Function-Cold-Start
// und ohne DB-Abfrage. Die Team-Liste lädt das Formular weiterhin live im
// Browser, bleibt also auch für spät angemeldete Teams tagesaktuell.
export const revalidate = 3600;

// Leeres Array: nichts zur Buildzeit vorrendern (anon darf die tables-Tabelle
// nicht listen). Notwendig, damit die on-demand gerenderten Token-Seiten
// überhaupt per ISR gecacht werden – ohne diesen Export bliebe die Route
// vollständig dynamisch (no-store). dynamicParams ist standardmäßig true, also
// werden unbekannte Tokens beim ersten Scan erzeugt und dann gecacht.
export function generateStaticParams() {
  return [];
}

export default async function TischPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Tischname auflösen (gecacht); bei Fehler/unbekanntem Token trotzdem
  // weiterarbeiten – das Ergebnis kann auch ohne Tischzuordnung gemeldet werden.
  let tableName: string | null = null;
  let invalidToken = false;
  try {
    tableName = await getTableName(token);
    if (!tableName) invalidToken = true;
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
