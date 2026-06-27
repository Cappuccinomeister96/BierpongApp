"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOrigin } from "@/lib/useOrigin";
import { QrCode } from "@/components/QrCode";
import { printQrCode } from "@/lib/printQr";
import { PrinterIcon, PlusIcon } from "@/components/icons";
import type { TableRow } from "@/lib/types";
import type { DashboardData } from "./Dashboard";

function QrTile({
  title,
  url,
  hint,
}: {
  title: string;
  url: string;
  hint?: string;
}) {
  return (
    <div className="card flex flex-col items-center p-4 text-center">
      <div className="font-medium">{title}</div>
      {hint ? <div className="mb-3 mt-0.5 text-xs text-muted">{hint}</div> : null}
      <div className="rounded-xl border border-line p-2">
        <QrCode value={url} size={172} />
      </div>
      <button
        onClick={() => printQrCode(title, url)}
        className="btn-secondary btn-sm mt-3"
      >
        <PrinterIcon size={16} /> Drucken
      </button>
    </div>
  );
}

export function TablesTab({
  data,
  reload,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
}) {
  const supabase = createClient();
  const origin = useOrigin();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addTable() {
    if (!name.trim()) return;
    setBusy(true);
    await supabase.from("tables").insert({ name: name.trim() });
    setName("");
    setBusy(false);
    await reload();
  }

  async function toggle(t: TableRow) {
    await supabase.from("tables").update({ active: !t.active }).eq("id", t.id);
    await reload();
  }

  async function remove(t: TableRow) {
    if (!confirm(`„${t.name}" löschen? Der QR-Code wird ungültig.`)) return;
    await supabase.from("tables").delete().eq("id", t.id);
    await reload();
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="no-print mb-3 px-1">
          <h2 className="text-xs font-medium uppercase tracking-wider text-faint">
            Allgemeine QR-Codes
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <QrTile title="Anmeldung" hint="Plakat zum Anmelden" url={`${origin}/anmelden`} />
          <QrTile
            title="Leaderboard"
            hint="Für Beamer / großen Bildschirm"
            url={`${origin}/leaderboard`}
          />
        </div>
      </section>

      <section>
        <h2 className="no-print mb-3 px-1 text-xs font-medium uppercase tracking-wider text-faint">
          Tische
        </h2>

        <div className="no-print mb-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTable()}
            placeholder="z. B. Tisch 3"
            className="input flex-1"
          />
          <button onClick={addTable} disabled={busy} className="btn-primary">
            <PlusIcon size={18} /> Tisch
          </button>
        </div>

        {data.tables.length === 0 ? (
          <p className="px-1 text-muted">Noch keine Tische angelegt.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.tables.map((t) => (
              <div
                key={t.id}
                className={`card flex flex-col items-center p-4 text-center ${
                  t.active ? "" : "opacity-50"
                }`}
              >
                <div className="font-medium">{t.name}</div>
                <div className="mb-3 text-xs text-faint">
                  {t.active ? "aktiv" : "inaktiv"}
                </div>
                <div className="rounded-xl border border-line p-2">
                  <QrCode value={`${origin}/tisch/${t.token}`} size={156} />
                </div>
                <button
                  onClick={() => printQrCode(t.name, `${origin}/tisch/${t.token}`)}
                  className="btn-secondary btn-sm mt-3"
                >
                  <PrinterIcon size={16} /> Drucken
                </button>
                <div className="no-print mt-2 flex gap-2">
                  <button onClick={() => toggle(t)} className="btn-secondary btn-sm">
                    {t.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="btn-secondary btn-sm !text-negative"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
