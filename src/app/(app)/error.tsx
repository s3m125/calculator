"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to Vercel logs without leaking to the user
    // eslint-disable-next-line no-console
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
        <p className="text-sm text-slate-500 mt-1">
          {error.message || "An unexpected error occurred. Try again or go back to the dashboard."}
        </p>
        {error.digest && (
          <p className="text-[11px] text-slate-400 mt-2 font-mono">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={reset} className="btn-primary">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link href="/dashboard-v2" className="btn-secondary">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
