"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface AppShellProps {
  userName: string;
  roleName: string;
  capabilities: string[];
  children: React.ReactNode;
}

export function AppShell({ userName, roleName, capabilities, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar
        capabilities={capabilities}
        user={{ name: userName, roleLabel: roleName }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          userName={userName}
          roleName={roleName}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 lg:px-8 py-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}
