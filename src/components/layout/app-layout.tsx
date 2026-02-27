"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { NavigatorProvider } from "@/components/navigator/navigator-context";
import { NavigatorButton } from "@/components/navigator/navigator-button";
import { NavigatorChat } from "@/components/navigator/navigator-chat";
import { NavigatorAvatar } from "@/components/navigator/navigator-avatar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <NavigatorProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
            {/* Dot grid background pattern */}
            <div className="dot-grid-bg" />
            <div className="relative z-10">{children}</div>
          </main>
        </div>
        {/* Navigator AI Advisor */}
        <NavigatorButton />
        <NavigatorChat />
        <NavigatorAvatar />
      </div>
    </NavigatorProvider>
  );
}
