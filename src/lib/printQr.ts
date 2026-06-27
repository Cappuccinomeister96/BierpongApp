import QRCode from "qrcode";

/**
 * Öffnet ein eigenes Druck-Fenster für genau EINEN QR-Code.
 *
 * So behält man die Kontrolle über die Größe: der QR wird hochauflösend
 * (1024px) gerendert und bleibt damit bei jeder Skalierung scharf. Die
 * eigentliche Größe stellt man im Druckdialog des Browsers über „Skalierung"
 * ein – die Vorschau zeigt den QR zentriert auf einer leeren Seite.
 */
export function printQrCode(title: string, url: string) {
  // Fenster SYNCHRON im Klick-Handler öffnen, sonst greift der Popup-Blocker
  // (das QR-Rendern weiter unten ist async).
  const win = window.open("", "_blank", "width=640,height=760");
  if (!win) {
    alert("Bitte Pop-ups für diese Seite erlauben, um den QR-Code zu drucken.");
    return;
  }

  win.document.write(
    `<!doctype html><title>${escapeHtml(title)}</title><p style="font-family:sans-serif;color:#666;margin:2rem">QR-Code wird vorbereitet…</p>`,
  );

  QRCode.toDataURL(url, { width: 1024, margin: 2 })
    .then((dataUrl) => {
      win.document.open();
      win.document.write(`<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1rem; padding: 2rem; text-align: center; color: #111;
  }
  h1 { font-size: 1.5rem; font-weight: 600; margin: 0; }
  /* Standardgröße; im Druckdialog über „Skalierung" anpassbar. */
  img { width: 80mm; height: 80mm; image-rendering: pixelated; }
  .url { font-size: 0.8rem; color: #666; word-break: break-all; max-width: 90%; }
  .hint { margin-top: 0.5rem; font-size: 0.75rem; color: #999; }
  @media print { .hint { display: none; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <img src="${dataUrl}" alt="QR-Code ${escapeHtml(title)}" />
  <div class="url">${escapeHtml(url)}</div>
  <div class="hint">Größe im Druckdialog über „Skalierung" anpassen.</div>
  <script>
    window.onload = function () { window.focus(); window.print(); };
    window.onafterprint = function () { window.close(); };
  </script>
</body>
</html>`);
      win.document.close();
    })
    .catch(() => {
      win.document.open();
      win.document.write(
        `<!doctype html><title>Fehler</title><p style="font-family:sans-serif;color:#b00;margin:2rem">QR-Code konnte nicht erzeugt werden.</p>`,
      );
      win.document.close();
    });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
