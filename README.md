# 🍺 Bierpong-Turnier-App

Web-App für ein über mehrere Stunden laufendes, **freies** Bierpong-Turnier auf einem
Vereinsfest. Spieler melden Teams an und tragen Ergebnisse per QR-Code ein, Schiedsrichter
bestätigen jedes Spiel, ein Live-Leaderboard läuft auf dem Beamer.

## Live-URLs

| Zweck | URL |
| --- | --- |
| Team-Anmeldung (Plakat-QR) | https://bierpong-turnier.netlify.app/anmelden |
| Öffentliches Leaderboard (Beamer) | https://bierpong-turnier.netlify.app/leaderboard |
| Schiri-Dashboard | https://bierpong-turnier.netlify.app/schiri |
| Ergebnis pro Tisch | `/tisch/<token>` (QR im Dashboard generieren) |

**Schiri-Login:** E-Mail `schiri@bierpong.local`, PIN wird separat geteilt (im Dashboard
unter *Config* änderbar bzw. in Supabase Auth zu ändern).

## Spielregeln

- Sieg **+3**, Niederlage **−1**, kein Unentschieden (Punktwerte im Dashboard editierbar).
- Tabellen-Sortierung: Punkte → meiste Siege → wenigste Spiele.
- Punkte zählen erst nach **Schiri-Freigabe** des Spiels.

## Ablauf am Eventtag

1. **Tische anlegen** im Dashboard (*Tische*) und QR-Codes drucken (laminieren).
2. **Anmelde-QR** (`/anmelden`) und **Leaderboard-QR** (`/leaderboard`) ebenfalls dort drucken.
3. Teams melden sich an → erscheinen **gelb** → Schiri bestätigt (Liste antippen **oder**
   Team-Bestätigungs-QR scannen) → **grün**.
4. Nach jedem Spiel: Tisch-QR scannen → Teams + Sieger wählen → Schiri gibt frei.
5. Leaderboard auf den Beamer (`/leaderboard`).

## Architektur

- **Next.js 16** (App Router) + **Tailwind 4**, gehostet auf **Netlify**.
- **Supabase** (Postgres, Auth, Realtime). Projekt-Ref: `mbprmbfwwbwvvuqpteoh` (Region eu-central-1).
- Spieler nutzen nur den `anon`-Key und haben **keinen** direkten Tabellenzugriff – Schreiben
  ausschließlich über eng validierte `SECURITY DEFINER`-RPCs (`register_team`, `submit_match`),
  Lesen nur über zwei öffentliche Views (`teams_public`, `leaderboard_public`). Spieler-Vornamen
  sind über keine öffentliche Schnittstelle sichtbar.
- Schiedsrichter sind `authenticated` (geteilter Account) und dürfen per RLS alles überschreiben.
- Punkte werden nie gespeichert, sondern aus freigegebenen Spielen in einer View berechnet.

Details zum DB-Setup: [`supabase/README.md`](supabase/README.md). Schema: [`supabase/migrations/`](supabase/migrations).

## Lokale Entwicklung

```bash
cp .env.local.example .env.local   # echte Supabase-Werte eintragen
npm install
npm run dev
```

## Deploy

Erneut deployen über die Netlify-Integration (lädt das Repo hoch und baut auf Netlify).
Env-Variablen (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SCHIRI_EMAIL`) sind in den Netlify-Projekteinstellungen hinterlegt.

## Vor dem Event empfohlen

- Supabase-Projekt auf **Pro** upgraden (kein Auto-Pause, tägliche Backups/PITR).
- Mit ein paar Testteams einen Durchlauf machen, dann *Config → Komplett zurücksetzen*.
