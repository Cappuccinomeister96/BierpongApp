/** Untergruppe der Spielregeln: Titel + Aufzählung. */
function RuleGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[13px] font-semibold uppercase tracking-wider text-faint">
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-faint" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Vollständiges Regelwerk – bei Anmeldung und im Schiri-Bereich.
 *  Gliederung: 1. Turnierregeln, 2. Spielregeln. */
export function Rules({
  siegPunkte = 3,
  niederlagePunkte = -1,
}: {
  siegPunkte?: number;
  niederlagePunkte?: number;
}) {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-muted">
      {/* 1. Turnierregeln */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-ink">1. Turnierregeln</h3>
        <p>
          Das Turnier läuft den ganzen Abend. Ihr spielt frei gegen andere Teams
          – es gibt keinen festen Spielplan. Wer viele Spiele gewinnt, gewinnt
          das Turnier.
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
      </section>

      {/* 2. Spielregeln */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-ink">2. Spielregeln</h3>

        <RuleGroup
          title="Standard"
          items={[
            "Pro Team zwei Spieler mit je einem vollen Getränk.",
            "Gastwürfe sind mit Einverständnis der Gegner zulässig.",
            "Der Gewinner von Schere-Stein-Papier darf entscheiden, wer anfängt.",
            "Der Ellenbogen muss bei Abwurf hinter der Tischkante sein.",
            "Sobald der Ball auf den Tisch oder Becher springt, darf der Ball abgewehrt werden.",
            "Kein Blasen oder Fingern! Wenn der Ball im Becher ist, ist keine Abwehr mehr möglich.",
            "Pro Spiel dürfen die Becher einmal umgestellt werden. Beim Umstellen wird sich mit dem hintersten Becher an der Tischkante orientiert.",
          ]}
        />

        <RuleGroup
          title="Treffer"
          items={[
            "Springt der Ball auf den Tisch und trifft danach einen Becher, zählt das als zwei Becher (Team, dessen Becher getroffen wurde, entscheidet).",
            "Wird mit beiden Bällen getroffen, werden die Bälle zurückgegeben. Während des Balls Back darf nicht umgestellt werden.",
            "Treffen beide Bälle in denselben Becher, werden zusätzlich 2 Becher entfernt (Team, dessen Becher getroffen wurde, entscheidet).",
          ]}
        />

        <RuleGroup
          title="Spielende"
          items={[
            "Trifft das Beginner-Team den letzten Becher, hat das andere Team ein oder zwei Nachwürfe, je nachdem, wie viele Würfe für den letzten Becher gebraucht wurden.",
            "Der Nachwurf zählt als erfolgreich, wenn durch ihn alle Becher des anderen Teams weggenommen werden müssen.",
            "Konsequenz eines erfolgreichen Nachwurfs: Alle Becher bleiben stehen. Die Bälle gehen zum Beginner-Team.",
          ]}
        />

        <RuleGroup
          title="Spezialfälle"
          items={[
            "Fällt ein Becher runter, zählt er als getroffen.",
            "Trickshot: Rollt der Ball auf dem Tisch in die eigene Hälfte zurück und wird vom eigenen Team geholt, gibt es einen Trickshot. Das andere Team darf das verhindern.",
          ]}
        />
      </section>
    </div>
  );
}
