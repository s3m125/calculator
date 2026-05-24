"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { QrScannerBox } from "./QrScannerBox";

export function GeneralScannerPanel() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function onScan(raw: string) {
    setError(null);
    let code = raw.trim();
    try {
      const u = new URL(raw);
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.indexOf("scan");
      if (idx >= 0 && parts[idx + 1]) code = parts[idx + 1];
    } catch {
      /* not a URL */
    }
    if (!code) {
      setError("Empty scan");
      return;
    }
    router.push(`/scan/${encodeURIComponent(code)}`);
  }

  return (
    <>
      <QrScannerBox onResult={onScan} />
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-3 py-2 mt-3">
          {error}
        </div>
      )}
    </>
  );
}
