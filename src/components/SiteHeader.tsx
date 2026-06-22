import Link from "next/link";
import Image from "next/image";

/** Gemeinsamer Hero-Header (Logo + Titel) für alle Seiten. */
export function SiteHeader() {
  return (
    // shrink-0: verhindert, dass WebKit den Header bei kurzem Viewport (Querformat) auf 0 schrumpft.
    <header className="relative shrink-0 overflow-hidden border-b border-line bg-gradient-to-b from-tint to-canvas">
      <DecorPattern />
      <Link
        href="/"
        className="relative mx-auto flex w-full max-w-md items-center gap-4 px-5 py-4"
      >
        {/* Vereinslogo: zum Tauschen public/Stelingen_TSV.gif ersetzen. */}
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-card shadow-card">
          <Image
            src="/Stelingen_TSV.gif"
            alt="TSV Stelingen"
            width={52}
            height={52}
            priority
            unoptimized
          />
        </div>
        <div className="min-w-0">
          {/* Fluid skaliert: passt einzeilig & ohne Overflow in jede Header-Breite.
              Textbreite = 10×fontSize, verfügbar = Breite−120px → 10vw−13px (≈10px Puffer), max 26px. */}
          <span
            className="block whitespace-nowrap font-bold leading-tight tracking-tight text-ink"
            style={{ fontSize: "clamp(0.9375rem, calc(10vw - 13px), 1.625rem)" }}
          >
            Bierpong Turnier
          </span>
          <span className="block whitespace-nowrap text-sm text-muted">
            von TSV Stelingen
          </span>
        </div>
      </Link>
    </header>
  );
}

/** Dezentes Becher-/Ball-Muster im Hero-Hintergrund. */
function DecorPattern() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full text-accent opacity-[0.06]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="40" cy="30" r="9" />
      <circle cx="150" cy="18" r="6" />
      <circle cx="250" cy="40" r="8" />
      <circle cx="330" cy="22" r="6" />
      <path d="M300 70h40l-5 38h-30l-5-38Z" />
      <path d="M350 78h34l-4 32h-26l-4-32Z" />
      <circle cx="90" cy="95" r="7" />
      <circle cx="200" cy="100" r="6" />
    </svg>
  );
}
