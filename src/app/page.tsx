import Link from "next/link";
import { ChevronRightIcon, TeamIcon, TrophyIcon } from "@/components/icons";

const links = [
  {
    href: "/anmelden",
    title: "Team anmelden",
    desc: "Melde dein Team an und tritt an",
    Icon: TeamIcon,
  },
  {
    href: "/leaderboard",
    title: "Live Leaderboard",
    desc: "Aktueller Tabellenstand und Ergebnisse",
    Icon: TrophyIcon,
  },
];

export default function Home() {
  return (
    // flex-1 + justify-center: zentriert den Inhalt im Platz zwischen Header und Footer.
    <div className="mx-auto flex w-full min-h-0 max-w-md flex-1 flex-col justify-center gap-4 px-5 py-2">
      <div className="text-center">
        <h2 className="text-2xl font-semibold leading-snug tracking-tight">
          Willkommen zum 100-jährigen Jubiläums-Bierpong-Turnier!
        </h2>
      </div>

      {/* space-y-4: Abstand zwischen den Karten bleibt unverändert. */}
      <div className="space-y-4">
        {links.map(({ href, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center justify-between gap-4 p-5 transition active:scale-[0.99]"
          >
            <div className="min-w-0">
              <Icon size={32} className="text-ink" />
              <div className="mt-3 text-[19px] font-semibold tracking-tight">
                {title}
              </div>
              <p className="mt-0.5 text-sm text-muted">{desc}</p>
            </div>
            <ChevronRightIcon className="shrink-0 text-accent" />
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Link
          href="/schiri"
          className="text-sm font-medium text-accent underline underline-offset-4"
        >
          Schiedsrichter-Bereich
        </Link>
      </div>
    </div>
  );
}
