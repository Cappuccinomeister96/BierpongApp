import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * Schlichter, mobil-first Inhaltsrahmen für Spieler-Seiten.
 * Header und Footer kommen global aus dem Root-Layout (SiteHeader/SiteFooter).
 */
export function PlayerShell({
  children,
  subtitle,
  back,
}: {
  children: React.ReactNode;
  subtitle?: string;
  /** Zeigt oben einen „Zurück"-Link zur Startseite (für Unterseiten). */
  back?: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-5 py-6">
      {subtitle ? (
        <p className="mb-3 text-[13px] font-medium uppercase tracking-wide text-faint">
          {subtitle}
        </p>
      ) : null}
      {children}
      {back ? (
        <Link
          href="/"
          className="mt-6 -ml-1 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-ink active:scale-[0.98]"
        >
          <ChevronLeftIcon size={18} />
          Zurück
        </Link>
      ) : null}
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
