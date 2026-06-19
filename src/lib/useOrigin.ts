"use client";

import { useEffect, useState } from "react";

/** Liefert window.location.origin client-seitig (leer beim ersten Render/SSR). */
export function useOrigin() {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}
