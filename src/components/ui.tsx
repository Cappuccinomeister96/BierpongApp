import { CheckIcon } from "@/components/icons";

/** Rote Hinweisbox für Formularfehler. */
export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-negative/10 px-3.5 py-2.5 text-sm text-negative">
      {children}
    </p>
  );
}

/** Grüner Kreis mit Haken (Erfolgs-Indikator). */
export function CheckCircle({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-full bg-positive/10 text-positive ${className}`}
    >
      <CheckIcon size={26} />
    </div>
  );
}

/** Zentrierter Erfolgs-Header: Haken + Titel + Beschreibung. */
export function SuccessHeader({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <CheckCircle />
      <h1 className="mt-3 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-[15px] text-muted">{children}</p>
    </>
  );
}

/** Zwei-Spalten-Auswahl des Siegers (Spieler-Meldung und Schiri-Freigabe). */
export function WinnerPicker({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            type="button"
            key={o.id}
            onClick={() => onChange(o.id)}
            disabled={disabled}
            className={`min-h-12 min-w-0 break-words rounded-xl border px-3 py-3 text-[15px] font-medium transition active:scale-[0.98] ${
              active
                ? "border-positive bg-positive/10 text-positive"
                : "border-line hover:bg-inset"
            }`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
