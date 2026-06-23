"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Schneidet evtl. Sekunden ab ("20:00:00" -> "20:00"); null/leer -> "". */
function hhmm(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

/** Reine Darstellung: "Turnierende 22:00 · Siegerehrung 22:30".
 *  Rendert nichts, wenn keine Zeit gesetzt ist. */
export function EventTimes({
  endTime,
  siegerehrung,
  className = "",
}: {
  endTime: string | null | undefined;
  siegerehrung: string | null | undefined;
  className?: string;
}) {
  const end = hhmm(endTime);
  const sieg = hhmm(siegerehrung);
  if (!end && !sieg) return null;

  return (
    <div className={className}>
      <table className="mx-auto border-separate border-spacing-x-4 border-spacing-y-1 text-sm">
        <tbody>
          {end ? (
            <tr>
              <td className="text-left text-muted">Turnierende</td>
              <td className="text-right font-semibold tabular-nums text-ink">
                {end}
              </td>
            </tr>
          ) : null}
          {sieg ? (
            <tr>
              <td className="text-left text-muted">Siegerehrung</td>
              <td className="text-right font-semibold tabular-nums text-ink">
                {sieg}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

/** Lädt die Zeiten selbst aus der Config und zeigt sie an (für Server-Seiten). */
export function EventTimesBanner({ className }: { className?: string }) {
  const [times, setTimes] = useState<{
    end: string | null;
    sieg: string | null;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("config")
      .select("end_time, siegerehrung_time")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setTimes({ end: data.end_time, sieg: data.siegerehrung_time });
      });
  }, []);

  if (!times) return null;
  return (
    <EventTimes
      endTime={times.end}
      siegerehrung={times.sieg}
      className={className}
    />
  );
}
