"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusIcon } from "@/components/icons";
import type { Team } from "@/lib/types";
import type { DashboardData } from "./Dashboard";

function TeamRow({ team, reload }: { team: Team; reload: () => Promise<void> }) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [v1, setV1] = useState(team.vorname1);
  const [v2, setV2] = useState(team.vorname2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function setStatus(status: "green" | "yellow") {
    setBusy(true);
    await supabase.from("teams").update({ status }).eq("id", team.id);
    await reload();
  }

  async function save() {
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from("teams")
      .update({ name: name.trim(), vorname1: v1.trim(), vorname2: v2.trim() })
      .eq("id", team.id);
    setBusy(false);
    if (error) {
      setErr("Speichern fehlgeschlagen (Name evtl. vergeben).");
      return;
    }
    setEditing(false);
    await reload();
  }

  async function remove() {
    if (
      !confirm(
        `Team „${team.name}" aus dem Turnier entfernen? Bereits gespielte Partien und alle Punkte (auch der Gegner) bleiben unverändert erhalten.`,
      )
    )
      return;
    setBusy(true);
    await supabase.rpc("remove_team", { p_team_id: team.id });
    await reload();
  }

  const green = team.status === "green";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${green ? "bg-positive" : "bg-faint"}`}
            />
            <span className="truncate font-medium">{team.name}</span>
          </div>
          <div className="ml-4 truncate text-sm text-muted">
            {team.vorname1} &amp; {team.vorname2}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!green ? (
            <button
              onClick={() => setStatus("green")}
              disabled={busy}
              className="btn-positive btn-sm"
            >
              Bestätigen
            </button>
          ) : (
            <button
              onClick={() => setStatus("yellow")}
              disabled={busy}
              className="btn-secondary btn-sm"
            >
              Zurückstufen
            </button>
          )}
          <button
            onClick={() => setEditing((e) => !e)}
            className="btn-secondary btn-sm"
          >
            {editing ? "Zu" : "Bearb."}
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="btn-secondary btn-sm !text-negative"
          >
            Entfernen
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2 rounded-xl bg-inset p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Teamname"
            className="input"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={v1}
              onChange={(e) => setV1(e.target.value)}
              placeholder="Vorname 1"
              className="input"
            />
            <input
              value={v2}
              onChange={(e) => setV2(e.target.value)}
              placeholder="Vorname 2"
              className="input"
            />
          </div>
          {err ? <p className="text-sm text-negative">{err}</p> : null}
          <button onClick={save} disabled={busy} className="btn-primary btn-sm">
            Speichern
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddTeam({ reload }: { reload: () => Promise<void> }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [v1, setV1] = useState("");
  const [v2, setV2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.from("teams").insert({
      name: name.trim(),
      vorname1: v1.trim(),
      vorname2: v2.trim(),
      status: "green",
      created_by: "referee",
    });
    setBusy(false);
    if (error) {
      setErr("Anlegen fehlgeschlagen (Name evtl. vergeben oder Felder leer).");
      return;
    }
    setName("");
    setV1("");
    setV2("");
    setOpen(false);
    await reload();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line py-3 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
      >
        <PlusIcon size={18} /> Team manuell anlegen
      </button>
    );
  }

  return (
    <div className="card space-y-2 p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Teamname"
        className="input"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={v1}
          onChange={(e) => setV1(e.target.value)}
          placeholder="Vorname 1"
          className="input"
        />
        <input
          value={v2}
          onChange={(e) => setV2(e.target.value)}
          placeholder="Vorname 2"
          className="input"
        />
      </div>
      {err ? <p className="text-sm text-negative">{err}</p> : null}
      <div className="flex gap-2">
        <button onClick={add} disabled={busy} className="btn-positive">
          Anlegen
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary">
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function RemovedRow({ team, reload }: { team: Team; reload: () => Promise<void> }) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  async function restore() {
    setBusy(true);
    await supabase.from("teams").update({ hidden: false }).eq("id", team.id);
    await reload();
  }
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate font-medium text-muted">{team.name}</div>
        <div className="truncate text-sm text-faint">
          {team.vorname1} &amp; {team.vorname2}
        </div>
      </div>
      <button onClick={restore} disabled={busy} className="btn-secondary btn-sm">
        Wiederherstellen
      </button>
    </div>
  );
}

export function TeamsTab({
  data,
  reload,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
}) {
  const active = data.teams.filter((t) => !t.hidden);
  const yellow = active.filter((t) => t.status === "yellow");
  const green = active.filter((t) => t.status === "green");
  const removed = data.teams.filter((t) => t.hidden);

  const section = (title: string, teams: Team[]) =>
    teams.length > 0 ? (
      <section>
        <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-faint">
          {title} ({teams.length})
        </h2>
        <div className="card divide-y divide-line overflow-hidden">
          {teams.map((t) => (
            <TeamRow key={t.id} team={t} reload={reload} />
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div className="space-y-6">
      <AddTeam reload={reload} />
      {active.length === 0 && removed.length === 0 ? (
        <p className="px-1 text-muted">Noch keine Teams angemeldet.</p>
      ) : (
        <>
          {section("Wartet auf Bestätigung", yellow)}
          {section("Bestätigt", green)}
          {removed.length > 0 ? (
            <section>
              <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-faint">
                Entfernt ({removed.length})
              </h2>
              <p className="mb-2 px-1 text-xs text-faint">
                Aus der Wertung genommen – ihre gespielten Partien und alle
                Punkte der Gegner bleiben erhalten.
              </p>
              <div className="card divide-y divide-line overflow-hidden">
                {removed.map((t) => (
                  <RemovedRow key={t.id} team={t} reload={reload} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
