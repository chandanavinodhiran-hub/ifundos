"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  GitPullRequestArrow,
  Landmark,
  Search,
  FolderKanban,
  Scale,
  Wallet,
  Building2,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "@/components/navigator/navigator-context";

/* ------------------------------------------------------------------ */
/* Tab config type + role-specific presets                              */
/* ------------------------------------------------------------------ */

export interface TabConfig {
  label: string;
  href: string;
  icon: LucideIcon;
  isOrb?: boolean;
  notificationDot?: boolean;
}

export const FM_TABS: TabConfig[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "RFPs", href: "/dashboard/rfps", icon: FileText },
  { label: "Navigator", href: "#navigator", icon: LayoutDashboard, isOrb: true },
  { label: "Pipeline", href: "/dashboard/applications", icon: GitPullRequestArrow, notificationDot: true },
  { label: "Grants", href: "/dashboard/grants", icon: Landmark },
];

export const CONTRACTOR_TABS: TabConfig[] = [
  { label: "Home", href: "/contractor", icon: LayoutDashboard },
  { label: "Opportunities", href: "/contractor/rfps", icon: Search },
  { label: "Navigator", href: "#navigator", icon: LayoutDashboard, isOrb: true },
  { label: "Applications", href: "/contractor/applications", icon: FileText, notificationDot: true },
  { label: "Contracts", href: "/contractor/contracts", icon: FolderKanban },
];

export const AUDITOR_TABS: TabConfig[] = [
  { label: "Home", href: "/audit", icon: LayoutDashboard },
  { label: "Programs", href: "/audit/programs", icon: Building2 },
  { label: "Navigator", href: "#navigator", icon: LayoutDashboard, isOrb: true },
  { label: "Decisions", href: "/audit/decisions", icon: Scale, notificationDot: true },
  { label: "Payments", href: "/audit/disbursements", icon: Wallet },
];

export const ADMIN_TABS: TabConfig[] = [
  { label: "Home", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users, notificationDot: true },
  { label: "Navigator", href: "#navigator", icon: LayoutDashboard, isOrb: true },
  { label: "Programs", href: "/admin/programs", icon: Building2 },
  { label: "System", href: "/admin/system", icon: Settings },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface TabBarProps {
  tabs?: TabConfig[];
  pendingCount?: number;
}

export function TabBar({ tabs = FM_TABS, pendingCount = 0 }: TabBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setMode } = useNavigator();

  function handleTabClick(tab: TabConfig) {
    if (tab.isOrb) {
      setMode("chat");
      return;
    }
    router.push(tab.href);
  }

  /** Check if a tab matches the current route */
  function isActive(href: string) {
    // Exact match for root pages (e.g. /dashboard, /contractor)
    const segments = href.split("/").filter(Boolean);
    if (segments.length <= 1) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 desktop:hidden tab-bar-nav">
      <div
        className="flex items-end justify-around bg-neu-base px-2"
        style={{
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "-6px -6px 14px rgba(255,250,240,0.8), 6px -6px 14px rgba(156,148,130,0.3)",
        }}
      >
        {tabs.map((tab) => {
          const active = !tab.isOrb && isActive(tab.href);
          const Icon = tab.icon;

          /* ── Navigator Orb (center tab) ── */
          if (tab.isOrb) {
            return (
              <button
                key="navigator-orb"
                onClick={() => handleTabClick(tab)}
                className="relative flex flex-col items-center cursor-pointer"
                style={{ marginTop: "-14px" }}
              >
                {/* Elevated charcoal sphere */}
                <div
                  className="w-[44px] h-[44px] rounded-full flex items-center justify-center"
                  style={{
                    background: "#1a1714",
                    boxShadow: "4px 4px 10px rgba(156,148,130,0.5), -4px -4px 10px rgba(255,250,240,0.6)",
                  }}
                >
                  {/* Gold gradient center with pulse */}
                  <div
                    className="w-[14px] h-[14px] rounded-full animate-orb-pulse"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, #d4b665, #b8943f)",
                      boxShadow: "0 0 12px rgba(184,148,63,0.35)",
                    }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-sovereign-gold mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          /* ── Regular tabs ── */
          return (
            <button
              key={tab.href}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[56px] min-h-[56px] pt-2 cursor-pointer transition-colors",
                active ? "text-sovereign-charcoal" : "text-[#9a9488]"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                {/* Notification dot */}
                {tab.notificationDot && pendingCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full"
                    style={{
                      background: "#b8943f",
                      boxShadow: "0 0 6px rgba(184,148,63,0.4)",
                    }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5",
                  active ? "font-bold text-sovereign-charcoal" : "font-medium text-[#9a9488]"
                )}
              >
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: "#b8943f" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
