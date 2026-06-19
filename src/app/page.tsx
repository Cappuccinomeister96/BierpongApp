import Link from "next/link";
import { PlayerShell } from "@/components/PlayerShell";
import { ChevronRightIcon } from "@/components/icons";

const links = [
  { href: "/anmelden", title: "Team anmelden", desc: "Melde dein Team beim Schiedsrichter an." },
  { href: "/leaderboard", title: "Leaderboard", desc: "Aktueller Tabellenstand." },
];

export default function Home() {
  return (
    <PlayerShell>
      <div className="space-y-6">
        <div className="px-1 pt-2">
          <h1 className="text-3xl font-semibold tracking-tight">Willkommen</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Scanne den QR-Code auf dem Anmelde-Plakat oder auf einem Tisch – oder
            wähle hier:
          </p>
        </div>

        <div className="space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="card flex items-center justify-between p-5 transition active:scale-[0.99]"
            >
              <div>
                <div className="text-[17px] font-semibold tracking-tight">
                  {l.title}
                </div>
                <p className="mt-0.5 text-sm text-muted">{l.desc}</p>
              </div>
              <ChevronRightIcon className="shrink-0 text-faint" />
            </Link>
          ))}
        </div>

        <Link
          href="/schiri"
          className="block px-1 pt-2 text-sm font-medium text-accent"
        >
          Schiedsrichter-Bereich
        </Link>
      </div>
    </PlayerShell>
  );
}
