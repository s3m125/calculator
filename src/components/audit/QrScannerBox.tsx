"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Type } from "lucide-react";

interface Props {
  onResult: (text: string) => void;
  paused?: boolean;
}

/**
 * Lightweight wrapper around html5-qrcode. Includes a manual-entry fallback
 * because mobile permissions are unreliable.
 */
export function QrScannerBox({ onResult, paused }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  async function start() {
    setError(null);
    if (!containerRef.current) return;
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      const inst = new Html5Qrcode(containerRef.current.id, {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
      });
      scannerRef.current = inst as unknown as typeof scannerRef.current;
      await inst.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          onResult(decoded);
        },
        () => {
          /* ignore per-frame errors */
        },
      );
      setActive(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Cannot access camera. Use manual entry below.",
      );
    }
  }

  async function stop() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* ignore */
    }
    setActive(false);
  }

  useEffect(() => {
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (paused && active) stop();
  }, [paused, active]);

  return (
    <div className="space-y-3">
      <div
        id="qr-scanner-container"
        ref={containerRef}
        className="w-full aspect-square max-w-sm mx-auto rounded-xl overflow-hidden bg-slate-900"
      />
      <div className="flex gap-2 justify-center">
        {!active ? (
          <button onClick={start} className="btn-primary">
            <Camera className="h-4 w-4" /> Start Camera
          </button>
        ) : (
          <button onClick={stop} className="btn-secondary">
            <CameraOff className="h-4 w-4" /> Stop
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-600 text-center">{error}</p>}

      <div className="border-t border-slate-200 pt-3">
        <label className="label flex items-center gap-1">
          <Type className="h-3 w-3" /> Manual entry
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = manual.trim();
            if (!v) return;
            onResult(v);
            setManual("");
          }}
          className="flex gap-2 mt-1"
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Type asset ID, e.g. LAP-2024-0001"
            className="input"
          />
          <button type="submit" className="btn-primary px-4">Add</button>
        </form>
      </div>
    </div>
  );
}
