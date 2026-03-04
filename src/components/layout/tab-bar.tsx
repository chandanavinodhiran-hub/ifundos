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

          /* ── Navigator Sapling (center tab) ── */
          if (tab.isOrb) {
            return (
              <button
                key="navigator-sapling"
                onClick={() => handleTabClick(tab)}
                className="relative flex flex-col items-center cursor-pointer"
                style={{ marginTop: "-14px" }}
              >
                {/* Raised sapling container */}
                <div
                  className="tab-sapling-breathe w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--bg-light, #E4E7EE)",
                    boxShadow:
                      "0 -4px 12px rgba(155,161,180,0.2), 4px 4px 10px rgba(155,161,180,0.3), -4px -4px 10px rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.5)",
                  }}
                >
                  {/* Inline sapling SVG */}
                  <svg width="28" height="32" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Seed body */}
                    <ellipse cx="14" cy="26" rx="5" ry="3.5" fill="rgba(95, 170, 100, 0.85)" />
                    {/* Stem */}
                    <path d="M14 22.5 C13.5 18 14.5 14 14 11" stroke="rgba(75, 145, 80, 0.80)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    {/* Left leaf */}
                    <path d="M14 12.5 C11 10.5 8 8.5 9 5.5 C10 3.5 13 4.5 14 7.5" fill="rgba(80, 160, 90, 0.85)" />
                    {/* Right leaf */}
                    <path d="M14 12.5 C17 10.5 20 9 19 6.5 C18 4.5 15 5 14 7.5" fill="rgba(80, 160, 90, 0.85)" />
                    {/* Left leaf vein */}
                    <path d="M14 8.5 C12 7.5 10.5 6 9.5 5.5" stroke="rgba(60, 130, 65, 0.4)" strokeWidth="0.5" fill="none" />
                    {/* Right leaf vein */}
                    <path d="M14 8.5 C16 7.5 17.5 6.5 18.5 6" stroke="rgba(60, 130, 65, 0.4)" strokeWidth="0.5" fill="none" />
                  </svg>
                </div>
                <span
                  className="text-[10px] font-semibold mt-1"
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
