import Link from "next/link";

/** Schlichter, mobil-first Rahmen für alle Spieler-Seiten. */
export function PlayerShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3.5">
          <Link href="/" className="text-[17px] font-semibold tracking-tight">
            Bierpong
          </Link>
          {subtitle ? (
            <span className="text-[13px] font-medium text-muted">{subtitle}</span>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">{children}</main>
      <footer className="no-print mx-auto w-full max-w-md px-5 py-8 text-center text-xs text-faint">
        Bei Fragen den Schiedsrichter ansprechen.
      </footer>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}
