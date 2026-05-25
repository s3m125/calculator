// Visual placeholder thumbnail for an asset, color-keyed by category prefix.
// Lets the Recent Assets table feel finished without needing real photos.
import { cn } from "@/lib/utils";

const PALETTE: Record<string, string> = {
  LAP:  "bg-indigo-100 text-indigo-700",
  PRT:  "bg-cyan-100 text-cyan-700",
  CCTV: "bg-rose-100 text-rose-700",
  NVR:  "bg-fuchsia-100 text-fuchsia-700",
  VTM:  "bg-amber-100 text-amber-700",
  LPR:  "bg-orange-100 text-orange-700",
  TLS:  "bg-emerald-100 text-emerald-700",
  VHC:  "bg-slate-200 text-slate-700",
  FRN:  "bg-yellow-100 text-yellow-700",
  OFE:  "bg-sky-100 text-sky-700",
  PJE:  "bg-teal-100 text-teal-700",
  WHE:  "bg-stone-200 text-stone-700",
  NET:  "bg-purple-100 text-purple-700",
  GEN:  "bg-lime-100 text-lime-700",
};

export function CategoryThumb({
  assetId,
  size = "md",
}: {
  assetId: string | null | undefined;
  size?: "sm" | "md";
}) {
  const prefix = (assetId ?? "AST").split("-")[0];
  const palette = PALETTE[prefix] ?? "bg-slate-100 text-slate-600";
  const cls =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : "h-10 w-10 text-[11px]";
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center font-semibold tracking-wider shrink-0",
        cls,
        palette,
      )}
    >
      {prefix}
    </div>
  );
}
