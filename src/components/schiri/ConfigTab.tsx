"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckIcon, LockIcon, ChevronRightIcon } from "@/components/icons";
import type { DashboardData } from "./Dashboard";

const DEFAULTS = { name: "Bierpong-Turnier", sieg: 3, niederlage: -1 };

const CHECKLIST = [
  "Supabase-Projekt auf Pro upgraden (kein Auto-Pause, Backups).",
  "Im Tab Tische alle Tische anlegen und QR-Codes drucken & laminieren.",
  "Anmelde- und Leaderboard-QR drucken.",
  "Schiri-PIN an alle Schiedsrichter geben.",
  "Mit Testteams einen Durchlauf machen, danach hier komplett zurücksetzen.",
];

/** Macht aus DB-Werten (z. B. "20:00" oder "20:00:00" / null) einen hh:mm-Wert fürs <input type="time">. */
function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

/** Einheitliches Abschnitts-Label wie in Teams/Tische. */
function SectionLabel({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "negative";
}) {
  return (
    <h2
      className={`mb-2 px-1 text-xs font-medium uppercase tracking-wider ${
        tone === "negative" ? "text-negative/80" : "text-faint"
      }`}
    >
      {children}
    </h2>
  );
}

export function ConfigTab({
  data,
  reload,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
}) {
  const supabase = createClient();
  const cfg = data.config;

  const [name, setName] = useState(cfg?.tournament_name ?? DEFAULTS.name);
  const [sieg, setSieg] = useState(cfg?.sieg_punkte ?? DEFAULTS.sieg);
  const [niederlage, setNiederlage] = useState(
    cfg?.niederlage_punkte ?? DEFAULTS.niederlage,
  );
  const [endTime, setEndTime] = useState(toTimeInput(cfg?.end_time));
  const [siegerehrung, setSiegerehrung] = useState(
    toTimeInput(cfg?.siegerehrung_time),
  );
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    const pointsChanged =
      Math.trunc(sieg) !== (cfg?.sieg_punkte ?? DEFAULTS.sieg) ||
      Math.trunc(niederlage) !== (cfg?.niederlage_punkte ?? DEFAULTS.niederlage);
    if (pointsChanged) {
      const ok = confirm(
        "Die Punkteänderung wirkt RÜCKWIRKEND auf alle bereits gespielten Spiele und verändert die Tabelle sofort. Fortfahren?",
      );
      if (!ok) return;
    }
    setBusy(true);
    setSaved(false);
    await supabase
      .from("config")
      .update({
        tournament_name: name.trim() || DEFAULTS.name,
        sieg_punkte: Math.trunc(sieg),
        niederlage_punkte: Math.trunc(niederlage),
        end_time: endTime || null,
        siegerehrung_time: siegerehrung || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setBusy(false);
    setSaved(true);
    await reload();
  }

  async function reset(deleteTeams: boolean) {
    const msg = deleteTeams
      ? "ALLES zurücksetzen? Alle Spiele UND alle Teams werden gelöscht."
      : "Alle Spiele löschen? Teams bleiben erhalten.";
    if (!confirm(msg)) return;
    setBusy(true);
    await supabase.rpc("reset_tournament", { p_delete_teams: deleteTeams });
    setBusy(false);
    await reload();
  }

  return (
    <div className="space-y-8">
      {/* Einstellungen – volle Breite, Felder responsiv */}
      <section>
        <SectionLabel>Turnier-Einstellungen</SectionLabel>
        <div className="card space-y-5 p-5">
          <div>
            <label className="label">Turniername</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">Punkte pro Sieg</label>
              <input
                type="number"
                value={sieg}
                onChange={(e) => setSieg(Number(e.target.value))}
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">Punkte pro Niederlage</label>
              <input
                type="number"
                value={niederlage}
                onChange={(e) => setNiederlage(Number(e.target.value))}
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">Turnier-Endzeit</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input tabular-nums"
              />
            </div>
            <div>
              <label className="label">Siegerehrung</label>
              <input
                type="time"
                value={siegerehrung}
                onChange={(e) => setSiegerehrung(e.target.value)}
                className="input tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted">
              Änderungen wirken sofort auf das gesamte Leaderboard.
            </p>
            <div className="flex items-center gap-3">
              {saved ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-positive">
                  <CheckIcon size={16} /> Gespeichert
                </span>
              ) : null}
              <button onClick={save} disabled={busy} className="btn-primary">
                {busy ? "Speichert…" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sekundäre Abschnitte: auf Desktop zweispaltig */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionLabel>Checkliste vor dem Event</SectionLabel>
          <div className="card p-5">
            <ul className="space-y-3 text-sm">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-inset text-muted">
                    <CheckIcon size={13} />
                  </span>
                  <span className="text-muted">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="space-y-8">
          <section>
            <SectionLabel>Sicherheit</SectionLabel>
            <Link
              href="/schiri/mfa-setup"
              className="card group flex items-center gap-4 p-4 transition hover:border-accent/40 active:scale-[0.99]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-inset text-ink">
                <LockIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  MFA einrichten / verwalten
                </span>
                <span className="block text-sm text-muted">
                  2-Faktor-Schutz per Authenticator-App.
                </span>
              </span>
              <ChevronRightIcon
                size={20}
                className="shrink-0 text-faint transition group-hover:text-ink"
              />
            </Link>
          </section>

          <section>
            <SectionLabel tone="negative">Gefahrenzone</SectionLabel>
            <div className="space-y-3 rounded-2xl border border-negative/20 bg-negative/5 p-5">
              <p className="text-sm text-muted">
                Diese Aktionen lassen sich nicht rückgängig machen.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => reset(false)}
                  disabled={busy}
                  className="btn-secondary w-full !border-negative/30 !text-negative"
                >
                  Spiele löschen (Teams behalten)
                </button>
                <button
                  onClick={() => reset(true)}
                  disabled={busy}
                  className="btn w-full bg-negative text-white hover:brightness-95"
                >
                  Alles zurücksetzen (inkl. Teams)
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
