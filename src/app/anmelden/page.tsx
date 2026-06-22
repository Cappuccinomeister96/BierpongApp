import { PlayerShell } from "@/components/PlayerShell";
import { AnmeldeForm } from "@/components/AnmeldeForm";

export const metadata = { title: "Team anmelden – Bierpong" };

export default function AnmeldenPage() {
  return (
    <PlayerShell subtitle="Anmeldung" back>
      <AnmeldeForm />
    </PlayerShell>
  );
}
