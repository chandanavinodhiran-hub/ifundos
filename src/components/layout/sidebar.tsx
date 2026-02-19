"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { roleNavigation } from "@/lib/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const role = session?.user?.role ?? "CONTRACTOR";
  const navItems = roleNavigation[role] ?? [];

  return (
    <aside
      className={cn(
        "h-screen bg-navy-800 text-white flex flex-col transition-all duration-200 border-r border-navy-700",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-navy-700 shrink-0">
        <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">iF</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-base leading-tight">iFundOS</h1>
            <p className="text-[10px] text-navy-300 leading-tight">Fund Operating System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal/20 text-teal-300"
                      : "text-navy-200 hover:bg-navy-700 hover:text-white"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-navy-700 text-navy-300 hover:text-white hover:bg-navy-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </aside>
  );
}
