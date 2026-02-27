"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { roleNavigation, roleLabels } from "@/lib/navigation";
import { ChevronLeft, ChevronRight, X, LogOut, Hexagon } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/** AI-related nav items get violet icon accent */
const AI_NAV_LABELS = new Set([
  "AI Review Pipeline",
  "AI Evidence Review",
  "AI Scoring Overview",
]);

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const role = session?.user?.role ?? "CONTRACTOR";
  const userName = session?.user?.name ?? "User";
  const navItems = roleNavigation[role] ?? [];
  const roleLabel = roleLabels[role] ?? role;

  // Generate initials for avatar
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1">
            <h1 className="font-bold text-base leading-tight text-white">iFundOS</h1>
            <p className="text-[10px] text-slate-400 leading-tight font-medium">Saudi Green Initiative</p>
          </div>
        )}
        {/* Close button for mobile drawer */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-700 md:hidden ml-auto"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            const isAiItem = AI_NAV_LABELS.has(item.label);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer relative",
                    isActive
                      ? "bg-slate-800 text-white border-l-2 border-violet-500 pl-[10px]"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive
                        ? isAiItem ? "text-violet-400" : "text-white"
                        : isAiItem ? "text-violet-400" : "text-slate-400"
                    )}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Avatar + Role (bottom) */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 mt-0.5">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out (mobile only) */}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex md:hidden items-center gap-3 px-4 py-3 border-t border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
      </button>

      {/* Collapse Toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex items-center justify-center h-12 border-t border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen bg-slate-900 flex-col transition-all duration-300 border-r border-slate-800",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-56 bg-slate-900 flex flex-col z-50 md:hidden border-r border-slate-800 shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
