"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { TabBar, FM_TABS, CONTRACTOR_TABS, AUDITOR_TABS, ADMIN_TABS } from "./tab-bar";
import { NavigatorProvider } from "@/components/navigator/navigator-context";
import { NavigatorButton } from "@/components/navigator/navigator-button";
import { NavigatorChat } from "@/components/navigator/navigator-chat";
import { NavigatorAvatar } from "@/components/navigator/navigator-avatar";
import { cn } from "@/lib/utils";
import { AmbientCaustics } from "@/components/ambient-caustics";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const isFundManager = session?.user?.role === "FUND_MANAGER";
  const isContractor = session?.user?.role === "CONTRACTOR";
  const isAuditor = session?.user?.role === "AUDITOR";
  const isAdmin = session?.user?.role === "ADMIN";
  const useTabBarNav = isFundManager || isContractor || isAuditor || isAdmin;

  return (
    <NavigatorProvider>
      <div className="app-shell flex h-screen overflow-hidden" style={{ background: "var(--surface-base)" }}>
        {/* Layer 2 — Ambient caustic light canvas (behind content, above body gradient) */}
        <AmbientCaustics />

        {/* Sidebar: hidden on mobile+tablet, visible at desktop (>=1200px) */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} disableMobileDrawer={useTabBarNav} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className={cn(
            "flex-1 overflow-y-auto p-4 md:p-6 desktop:px-8 desktop:pt-6 desktop:pb-10 relative main-vignette",
            useTabBarNav && "pb-safe desktop:pb-10"
          )}>
            <div className="max-w-[1100px] mx-auto relative z-10">{children}</div>
          </main>
        </div>

        {/* Bottom Tab Bar — visible on mobile+tablet, hidden at desktop */}
        {useTabBarNav && (
          <TabBar tabs={isFundManager ? FM_TABS : isContractor ? CONTRACTOR_TABS : isAuditor ? AUDITOR_TABS : ADMIN_TABS} />
        )}

        {/* Navigator — floating button hidden on mobile when tab bar is active, always visible on desktop */}
        <div className={cn(useTabBarNav && "hidden desktop:block")}>
          <NavigatorButton />
        </div>
        <NavigatorChat />
        <NavigatorAvatar />
      </div>
    </NavigatorProvider>
  );
}
