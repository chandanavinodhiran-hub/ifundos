"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { roleNavigation } from "@/lib/navigation";
import { Hexagon } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  disableMobileDrawer?: boolean;
}

export function Sidebar({ isOpen, onClose, disableMobileDrawer }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role ?? "CONTRACTOR";
  const navItems = roleNavigation[role] ?? [];

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/contractor" || href === "/audit" || href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop sidebar — visible at ≥1200px, neumorphic warm surface */}
      <aside
        className="hidden desktop:flex flex-col shrink-0"
        style={{
          width: 220,
          height: "100vh",
          background: "#f8f5ef",
          borderRight: "1px solid #e8e2d4",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-sovereign-gold flex items-center justify-center shrink-0">
            <Hexagon className="w-5 h-5 text-sovereign-charcoal" />
          </div>
          <div>
            <h1 className="font-bold text-[15px] leading-tight" style={{ color: "#1a1714" }}>iFundOS</h1>
            <p className="text-[10px] leading-tight font-medium" style={{ color: "#9a9488" }}>Saudi Green Initiative</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 rounded-[14px] text-[14px] font-medium cursor-pointer transition-all duration-200",
                  active
                    ? "font-semibold"
                    : "hover:bg-[rgba(184,148,63,0.06)]"
                )}
                style={
                  active
                    ? {
                        color: "#1a1714",
                        background: "#f2efe7",
                        borderLeft: "3px solid #1a1714",
                        paddingLeft: "13px",
                      }
                    : { color: "#8a8275" }
                }
              >
                <Icon className="w-5 h-5 shrink-0" style={{ color: active ? "#1a1714" : "#8a8275" }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <p className="text-[9px] text-center mt-6" style={{ color: "#9a9488" }}>
          Powered by Iozera Technologies
        </p>
      </aside>

      {/* Mobile drawer overlay — only for roles that don't use tab bar */}
      {!disableMobileDrawer && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 desktop:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer — only for roles that don't use tab bar */}
      {!disableMobileDrawer && (
        <aside
          className={cn(
            "fixed left-0 top-0 h-full w-56 bg-sovereign-charcoal flex flex-col z-50 desktop:hidden border-r border-sovereign-ink shadow-2xl transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-sovereign-ink shrink-0">
            <div className="w-9 h-9 rounded-xl bg-sovereign-gold flex items-center justify-center shrink-0">
              <Hexagon className="w-5 h-5 text-sovereign-charcoal" />
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight text-sovereign-ivory">iFundOS</h1>
              <p className="text-[10px] text-sovereign-stone leading-tight font-medium">Saudi Green Initiative</p>
            </div>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                        active
                          ? "bg-sovereign-ink text-sovereign-ivory border-l-2 border-sovereign-gold pl-[10px]"
                          : "text-sovereign-warm hover:bg-sovereign-ink/50 hover:text-sovereign-ivory"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 shrink-0", active ? "text-sovereign-ivory" : "text-sovereign-stone")} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      )}
    </>
  );
}
