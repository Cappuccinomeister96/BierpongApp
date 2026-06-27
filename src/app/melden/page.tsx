import { PlayerShell } from "@/components/PlayerShell";
import { ErgebnisForm } from "@/components/ErgebnisForm";

export const metadata = { title: "Ergebnis melden – Bierpong" };

export default function MeldenPage() {
  return (
    <PlayerShell subtitle="Ergebnis melden" back>
      <ErgebnisForm selectable />
    </PlayerShell>
  );
}
