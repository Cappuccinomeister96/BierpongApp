"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Rendert einen QR-Code für einen beliebigen Text/URL als Bild. */
export function QrCode({
  value,
  size = 220,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-inset ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-faint">QR…</span>
      </div>
    );
  }

  return (
    // QR-Codes sind data-URLs – next/image bringt hier keinen Vorteil.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="QR-Code"
      width={size}
      height={size}
      className={`h-auto max-w-full rounded-lg ${className}`}
    />
  );
}
