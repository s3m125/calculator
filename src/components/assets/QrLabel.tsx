"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Printer, Download } from "lucide-react";

interface QrLabelProps {
  asset: {
    asset_id: string;
    name: string;
    category_name: string;
    location_name: string;
    serial_number: string;
  };
  payload: string;
}

export function QrLabel({ asset, payload }: QrLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    QRCode.toDataURL(payload, { width: 600, margin: 1 }).then(setDataUrl);
  }, [payload]);

  return (
    <div>
      <div className="card p-6 print:shadow-none print:border-2 print:border-black mx-auto max-w-md">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-widest text-slate-500">GSI Asset Control</p>
          <h2 className="text-lg font-bold mt-1 truncate">{asset.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{asset.category_name}</p>
        </div>
        <div className="flex justify-center my-4">
          <canvas ref={canvasRef} />
        </div>
        <div className="text-center">
          <p className="text-base font-mono font-bold tracking-wider">{asset.asset_id}</p>
          {asset.serial_number && (
            <p className="text-xs text-slate-500 mt-1">S/N {asset.serial_number}</p>
          )}
          {asset.location_name && (
            <p className="text-xs text-slate-500">{asset.location_name}</p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-3 mt-6 no-print">
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="h-4 w-4" /> Print Label
        </button>
        {dataUrl && (
          <a href={dataUrl} download={`qr-${asset.asset_id}.png`} className="btn-secondary">
            <Download className="h-4 w-4" /> Download PNG
          </a>
        )}
      </div>
    </div>
  );
}
