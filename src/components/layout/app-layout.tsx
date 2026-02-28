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
      <div className={cn(
        "app-shell flex h-screen overflow-hidden",
        useTabBarNav ? "bg-neu-base" : "bg-sovereign-parchment"
      )}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} disableMobileDrawer={useTabBarNav} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className={cn(
            "flex-1 overflow-y-auto p-4 md:p-6 relative",
            useTabBarNav && "pb-safe md:pb-6"
          )}>
            <div className="dot-grid-bg" />
            <div className="relative z-10 stagger-children">{children}</div>
          </main>
        </div>

        {/* Bottom Tab Bar — mobile only, for roles with tab bar nav */}
        {useTabBarNav && (
          <TabBar tabs={isFundManager ? FM_TABS : isContractor ? CONTRACTOR_TABS : isAuditor ? AUDITOR_TABS : ADMIN_TABS} />
        )}

        {/* Navigator — floating button hidden on mobile when tab bar is active */}
        <div className={cn(useTabBarNav && "hidden md:block")}>
          <NavigatorButton />
        </div>
        <NavigatorChat />
        <NavigatorAvatar />
      </div>
    </NavigatorProvider>
  );
}
