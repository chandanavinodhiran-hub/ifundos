"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Main application layout wrapping all authenticated pages
 * Provides sidebar navigation and top bar with user info
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-200">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
