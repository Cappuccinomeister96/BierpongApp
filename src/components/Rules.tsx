/** Kurzes Regelwerk – bei Anmeldung und im Schiri-Bereich. */
export function Rules({
  siegPunkte = 3,
  niederlagePunkte = -1,
}: {
  siegPunkte?: number;
  niederlagePunkte?: number;
}) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-muted">
      <p>
        Das Turnier läuft den ganzen Abend. Ihr spielt frei gegen andere Teams –
        es gibt keinen festen Spielplan. Wer viele Spiele gewinnt, gewinnt das
        Turnier.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-inset px-4 py-3">
          <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
            {siegPunkte > 0 ? `+${siegPunkte}` : siegPunkte}
          </div>
          <div className="mt-0.5 text-[13px]">pro Sieg</div>
        </div>
        <div className="rounded-xl bg-inset px-4 py-3">
          <div className="text-2xl font-semibold tracking-tight text-ink tabular-nums">
            {niederlagePunkte}
          </div>
          <div className="mt-0.5 text-[13px]">pro Niederlage</div>
        </div>
      </div>
      <p>
        Kein Unentschieden. Ein Team besteht aus zwei Personen. Ein- und
        Aussteigen ist jederzeit möglich. Ergebnisse werden nach jedem Spiel am
        Tisch-QR-Code eingetragen und vom Schiedsrichter bestätigt.
      </p>
    </div>
  );
}
