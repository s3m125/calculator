"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, Menu } from "lucide-react";
import styles from "./DashboardV2.module.css";
import { cn } from "@/lib/utils";

interface Props {
  initials: string;
  userName: string;
  roleLabel: string;
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardV2Shell({ initials, userName, roleLabel, sidebar, topbar, children }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className={styles.app}>
      <div
        className={cn(styles.overlay, open && styles.overlayOpen)}
        onClick={() => setOpen(false)}
      />
      <aside className={cn(styles.sidebar, open && styles.sidebarOpen)}>
        {sidebar}
        {/* User profile card pinned at bottom */}
        <div className={styles.sideUser}>
          <div className={styles.sideUserAvatar}>{initials || "U"}</div>
          <div className="min-w-0">
            <div className={styles.sideUserName}>{userName}</div>
            <div className={styles.sideUserRole}>{roleLabel}</div>
          </div>
          <button onClick={signOut} className={styles.sideUserChev} title="Sign out">
            <ChevronDown />
          </button>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.hamburger}
            onClick={() => setOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu />
          </button>
          {topbar}
          <div className={styles.topRight}>
            <button className={styles.bell} aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              <span className={styles.bellDot}>3</span>
            </button>
            <div className={styles.topUser}>
              <div className={styles.topUserAvatar}>{initials || "U"}</div>
              <span className={styles.topUserName}>{userName}</span>
              <span className={styles.topUserChev}>
                <ChevronDown />
              </span>
            </div>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
