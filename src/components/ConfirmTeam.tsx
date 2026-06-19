"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CheckIcon } from "@/components/icons";

function StatusChip({ status }: { status: "yellow" | "green" }) {
  const green = status === "green";
  return (
    <span
      className={`chip ${green ? "bg-positive/10 text-positive" : "bg-inset text-muted"}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${green ? "bg-positive" : "bg-faint"}`}
      />
      {green ? "Bestätigt" : "Ausstehend"}
    </span>
  );
}

export function ConfirmTeam({
  team,
}: {
  team: { id: string; name: string; vorname1: string; vorname2: string; status: "yellow" | "green" };
}) {
  const supabase = createClient();
  const [status, setStatus] = useState(team.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(team.status === "green");

  async function setTeam(next: "yellow" | "green") {
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("teams")
      .update({ status: next })
      .eq("id", team.id);
    setBusy(false);
    if (error) {
      setError("Aktion fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    setStatus(next);
    setDone(next === "green");
  }

  return (
    <div className="flex min-h-full items-center justify-center px-5 py-10">
      <div className="card w-full max-w-sm space-y-5 p-6">
        <div className="text-center">
          {done ? (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-positive/10 text-positive">
              <CheckIcon size={26} />
            </div>
          ) : null}
          <h1 className="mt-3 text-xl font-semibold tracking-tight">
            {done ? "Team bestätigt" : "Team bestätigen"}
          </h1>
          <p className="mt-1 text-[15px] text-muted">
            {done
              ? "Das Team darf jetzt spielen."
              : "Bitte die Daten prüfen und bestätigen."}
          </p>
        </div>

        <div className="space-y-2 rounded-xl bg-inset p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-faint">
              Team
            </span>
            <StatusChip status={status} />
          </div>
          <div className="text-lg font-semibold tracking-tight">{team.name}</div>
          <div className="text-sm text-muted">
            {team.vorname1} &amp; {team.vorname2}
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-negative/10 px-3.5 py-2.5 text-sm text-negative">
            {error}
          </p>
        ) : null}

        {!done ? (
          <button
            onClick={() => setTeam("green")}
            disabled={busy}
            className="btn-positive w-full"
          >
            {busy ? "Wird bestätigt…" : "Bestätigen"}
          </button>
        ) : (
          <button
            onClick={() => setTeam("yellow")}
            disabled={busy}
            className="btn-secondary w-full"
          >
            Bestätigung zurücknehmen
          </button>
        )}

        <Link href="/schiri" className="block text-center text-sm font-medium text-accent">
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
