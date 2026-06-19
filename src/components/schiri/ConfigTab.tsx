"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardData } from "./Dashboard";

export function ConfigTab({
  data,
  reload,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
}) {
  const supabase = createClient();
  const cfg = data.config;

  const [name, setName] = useState(cfg?.tournament_name ?? "Bierpong-Turnier");
  const [sieg, setSieg] = useState(cfg?.sieg_punkte ?? 3);
  const [niederlage, setNiederlage] = useState(cfg?.niederlage_punkte ?? -1);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    const pointsChanged =
      Math.trunc(sieg) !== (cfg?.sieg_punkte ?? 3) ||
      Math.trunc(niederlage) !== (cfg?.niederlage_punkte ?? -1);
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
        tournament_name: name.trim() || "Bierpong-Turnier",
        sieg_punkte: Math.trunc(sieg),
        niederlage_punkte: Math.trunc(niederlage),
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
    <div className="max-w-md space-y-6">
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold tracking-tight">Einstellungen</h2>

        <div>
          <label className="label">Turniername</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={busy} className="btn-primary">
            Speichern
          </button>
          {saved ? <span className="text-sm text-positive">Gespeichert</span> : null}
        </div>
        <p className="text-xs text-muted">
          Änderungen wirken sofort auf das gesamte Leaderboard.
        </p>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-semibold tracking-tight">Checkliste vor dem Event</h2>
        <ul className="space-y-1.5 text-sm text-muted">
          <li>Supabase-Projekt auf Pro upgraden (kein Auto-Pause, Backups).</li>
          <li>Im Tab Tische alle Tische anlegen und QR-Codes drucken &amp; laminieren.</li>
          <li>Anmelde- und Leaderboard-QR drucken.</li>
          <li>Schiri-PIN an alle Schiedsrichter geben.</li>
          <li>Mit Testteams einen Durchlauf machen, danach hier komplett zurücksetzen.</li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-negative/20 bg-negative/5 p-5">
        <h2 className="font-semibold tracking-tight text-negative">Gefahrenzone</h2>
        <button
          onClick={() => reset(false)}
          disabled={busy}
          className="btn-secondary w-full !border-negative/30 !text-negative"
        >
          Alle Spiele löschen (Teams behalten)
        </button>
        <button
          onClick={() => reset(true)}
          disabled={busy}
          className="btn w-full bg-negative text-white hover:brightness-95"
        >
          Komplett zurücksetzen
        </button>
      </section>
    </div>
  );
}
