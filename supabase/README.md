# Supabase-Setup

## 1. Migration anwenden

Das komplette Schema (Tabellen, RLS, RPCs, Views, Realtime, Seed) liegt in
`supabase/migrations/0001_init.sql`. Im Supabase-Projekt unter
**SQL Editor** ausführen (oder via MCP/CLI als Migration anwenden).

## 2. Schiedsrichter-Account anlegen

Die App nutzt **einen geteilten** Auth-Account; die „PIN" ist dessen Passwort.

- Supabase Dashboard → **Authentication → Users → Add user**
  - E-Mail: identisch zu `NEXT_PUBLIC_SCHIRI_EMAIL` (z. B. `schiri@bierpong.local`)
  - Passwort: die gewünschte **Schiri-PIN**
  - „Auto Confirm User" aktivieren
- Optional weitere Schiri-Geräte: dieselbe E-Mail/PIN auf mehreren Handys nutzbar.

> Tipp: E-Mail-Bestätigung kann unter **Authentication → Providers → Email**
> deaktiviert werden, da kein echter Mailversand nötig ist.

## 3. Environment-Variablen

Aus **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SCHIRI_EMAIL` (die in Schritt 2 verwendete E-Mail)

Lokal in `.env.local`, in Produktion als Netlify-Env-Variablen setzen.

## 4. Vor dem Event

- Supabase-Projekt auf **Pro** upgraden (kein Auto-Pause, tägliche Backups, PITR).
- Tische im Schiri-Dashboard unter **Tische** anlegen und QR-Codes drucken.
- Anmelde- und Leaderboard-QR ebenfalls dort drucken.

## Sicherheitsmodell (Kurzfassung)

- `anon` (Spieler) hat **keinen** direkten Tabellenzugriff – nur die RPCs
  `register_team`, `submit_match`, `get_table` und die Views `teams_public`,
  `leaderboard_public` (+ Lesezugriff auf `config`).
- `authenticated` (Schiri) darf via RLS alles lesen/schreiben.
- Vornamen sind über keine `anon`-Schnittstelle sichtbar.
- Punkte werden aus freigegebenen Spielen berechnet (View), nie gespeichert.
