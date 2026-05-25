import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { Boxes } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <Boxes className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">GSI Asset Control</h1>
            <p className="text-xs text-slate-500">Asset management for project-based companies</p>
          </div>
        </div>
        <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
        <div className="mt-6 text-xs text-slate-500 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <p className="font-medium text-slate-700 mb-1">Demo accounts</p>
          <p>admin@gsi.local · finance@gsi.local · pm@gsi.local · tech1@gsi.local · ceo@gsi.local</p>
          <p className="mt-1">Password: <span className="font-mono">Gsi#Demo2026</span></p>
        </div>
      </div>
    </div>
  );
}
