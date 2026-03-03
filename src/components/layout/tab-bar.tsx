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
    const segments = href.split("/").filter(Boolean);
    if (segments.length <= 1) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 desktop:hidden tab-bar-neu">
      <div
        className="flex items-end justify-around px-2"
        style={{
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
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
                style={{ marginTop: "-8px" }}
              >
                {/* Orbital ring wrapper */}
                <div className="navigator-orb-wrapper">
                  {/* The orb sphere */}
                  <div className="navigator-orb">
                    {/* Inner gradient core */}
                    <div
                      className="w-[10px] h-[10px] rounded-full relative z-[1]"
                      style={{
                        background: "radial-gradient(circle at 35% 35%, #A8B5DB, #7B8DC8)",
                        boxShadow: "0 0 8px rgba(92,111,181,0.45)",
                      }}
                    />
                  </div>
                </div>
                <span
                  key={pathname}
                  className="text-[10px] font-semibold mt-1 orb-label-pulse"
                  style={{ color: "var(--accent)" }}
                >
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
                "relative flex flex-col items-center justify-center min-w-[56px] pt-2 cursor-pointer transition-all duration-200",
                active
                  ? "min-h-[56px] rounded-2xl px-3 py-1.5"
                  : "min-h-[56px]"
              )}
              style={{
                color: active ? "var(--accent-dark)" : "var(--text-muted)",
                ...(active
                  ? {
                      background: "#DFE2EA",
                      boxShadow:
                        "inset 4px 4px 10px rgba(155,161,180,0.35), inset -4px -4px 10px rgba(255,255,255,0.55)",
                    }
                  : {}),
              }}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5]")} />
                {/* Notification dot */}
                {tab.notificationDot && pendingCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full"
                    style={{
                      background: "var(--accent)",
                      boxShadow: "0 0 6px rgba(92,111,181,0.4)",
                    }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5",
                  active ? "font-bold" : "font-medium"
                )}
              >
                {tab.label}
              </span>
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute bottom-0.5 w-1 h-1 rounded-full"
                  style={{ background: "var(--accent)", boxShadow: "0 0 6px rgba(92,111,181,0.3)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
