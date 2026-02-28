"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { roleLabels, roleBadgeVariant } from "@/lib/navigation";
import { LogOut, Building2, Menu, Hexagon, Settings, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "";
  const roleLabel = roleLabels[role] ?? role;
  const badgeClass = roleBadgeVariant[role] ?? "bg-gray-100 text-gray-800";
  const isFundManager = role === "FUND_MANAGER";
  const isContractor = role === "CONTRACTOR";
  const isAuditor = role === "AUDITOR";
  const isAdmin = role === "ADMIN";
  const useTabBar = isFundManager || isContractor || isAuditor || isAdmin;

  // Hydration guard for portal
  useEffect(() => { setMounted(true); }, []);

  // Close dropdown when clicking outside (desktop + mobile portal)
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      // Don't close if clicking inside the desktop dropdown area
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      // Don't close if clicking inside the mobile portal sheet
      if (sheetRef.current && sheetRef.current.contains(target)) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className={cn(
        "h-14 md:h-16 border-b flex items-center justify-between px-3 md:px-6 shrink-0 relative",
        useTabBar
          ? "bg-neu-light border-neu-dark/50"
          : "bg-sovereign-cream border-sovereign-warm/20"
      )} style={{ zIndex: 100 }}>
        {/* Left: Hamburger (only for roles without tab bar) + context */}
        <div className="flex items-center gap-2 text-sm text-sovereign-stone min-w-0">
          {!useTabBar && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="p-2 -ml-1 md:hidden rounded-lg cursor-pointer shrink-0 hover:bg-sovereign-parchment"
            >
              <Menu className="w-5 h-5 text-sovereign-charcoal" />
            </button>
          )}
          {/* Mobile: show iFundOS logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-sovereign-gold flex items-center justify-center shrink-0">
              <Hexagon className="w-4 h-4 text-sovereign-charcoal" />
            </div>
            <span className="font-bold text-sm text-sovereign-charcoal">iFundOS</span>
          </div>
          {/* Desktop: show org name */}
          <Building2 className="w-4 h-4 hidden md:block shrink-0" />
          <span className="font-medium truncate hidden md:inline">{user?.organizationName ?? "iFundOS"}</span>
        </div>

        {/* Right: User info + avatar */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative" ref={dropdownRef}>
          {/* Desktop: name + role badge */}
          <div className={cn("text-right", useTabBar ? "hidden md:block" : "hidden sm:block")}>
            <p className="text-sm font-medium text-sovereign-charcoal leading-tight truncate max-w-[120px]">
              {user?.name ?? "User"}
            </p>
            <span
              className={cn(
                "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5",
                useTabBar ? "bg-[rgba(184,148,63,0.12)] text-sovereign-gold" : badgeClass
              )}
            >
              {roleLabel}
            </span>
          </div>

          {/* Avatar circle — tappable */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-shadow"
            style={{
              background: "#1a1714",
              boxShadow: menuOpen
                ? "inset 2px 2px 4px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(60,55,45,0.2)"
                : "2px 2px 6px rgba(156,148,130,0.4), -2px -2px 6px rgba(255,250,240,0.6)",
            }}
          >
            <span className="text-xs font-bold text-sovereign-gold">{initials}</span>
          </button>

          {/* Desktop Dropdown */}
          {menuOpen && (
            <div
              className="hidden md:block absolute top-[52px] right-0 w-[280px] rounded-2xl p-4"
              style={{
                zIndex: 9999,
                background: "#e8e0d0",
                boxShadow: "8px 8px 24px rgba(156,148,130,0.5), -8px -8px 24px rgba(255,250,240,0.7), 0 10px 40px rgba(0,0,0,0.15)",
              }}
            >
              <AvatarMenuContent user={user} roleLabel={roleLabel} initials={initials} onClose={() => setMenuOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Sheet — rendered via portal at document body to escape overflow:hidden containers */}
      {menuOpen && mounted && createPortal(
        <div ref={sheetRef} className="md:hidden" style={{ position: "relative", zIndex: 99999 }}>
          {/* Overlay */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 99999, background: "rgba(26, 23, 20, 0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 animate-slide-up-sheet avatar-sheet"
            style={{
              zIndex: 100000,
              background: "#e8e0d0",
              borderRadius: "24px 24px 0 0",
              padding: "16px 24px 40px",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.2)",
            }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(122,114,101,0.3)" }} />
            <AvatarMenuContent user={user} roleLabel={roleLabel} initials={initials} onClose={() => setMenuOpen(false)} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared menu content for both mobile sheet and desktop dropdown       */
/* ------------------------------------------------------------------ */
function AvatarMenuContent({
  user,
  roleLabel,
  initials,
  onClose,
}: {
  user: { name?: string | null; email?: string | null; role?: string; organizationName?: string | null } | undefined;
  roleLabel: string;
  initials: string;
  onClose: () => void;
}) {
  function handleSignOut(e: React.MouseEvent) {
    e.stopPropagation();
    signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="space-y-4">
      {/* User info */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: "#1a1714",
            boxShadow: "2px 2px 6px rgba(156,148,130,0.4), -2px -2px 6px rgba(255,250,240,0.6)",
          }}
        >
          <span className="text-sm font-bold text-sovereign-gold">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-bold" style={{ color: "#1a1714" }}>
            {user?.name ?? "User"}
          </p>
          <p className="text-[12px]" style={{ color: "#7a7265" }}>
            {roleLabel} · {user?.organizationName ?? "iFundOS"}
          </p>
          <p className="text-[12px] font-mono truncate" style={{ color: "#9a9488" }}>
            {user?.email ?? ""}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(156,148,130,0.2)" }} />

      {/* Menu items */}
      <div className="space-y-1">
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer transition-colors hover:bg-neu-dark/30 active:bg-neu-dark/50"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div className="flex items-center gap-3 pointer-events-none">
            <Settings className="w-4 h-4" style={{ color: "#7a7265" }} />
            <span className="text-[14px] font-medium" style={{ color: "#1a1714" }}>Account Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 pointer-events-none" style={{ color: "#9a9488" }} />
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer transition-colors hover:bg-neu-dark/30 active:bg-neu-dark/50"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div className="flex items-center gap-3 pointer-events-none">
            <Bell className="w-4 h-4" style={{ color: "#7a7265" }} />
            <span className="text-[14px] font-medium" style={{ color: "#1a1714" }}>Notification Preferences</span>
          </div>
          <ChevronRight className="w-4 h-4 pointer-events-none" style={{ color: "#9a9488" }} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(156,148,130,0.2)" }} />

      {/* Sign Out */}
      <button
        type="button"
        className="w-full flex items-center gap-3 py-3 px-2 rounded-xl cursor-pointer transition-colors hover:bg-[rgba(156,74,74,0.08)] active:bg-[rgba(156,74,74,0.15)]"
        onClick={handleSignOut}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <LogOut className="w-4 h-4 pointer-events-none" style={{ color: "#9c4a4a" }} />
        <span className="text-[14px] font-semibold pointer-events-none" style={{ color: "#9c4a4a" }}>Sign Out</span>
      </button>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(156,148,130,0.2)" }} />

      {/* Footer */}
      <p className="text-[10px] text-center" style={{ color: "#9a9488" }}>
        Powered by Iozera Technologies
      </p>
    </div>
  );
}
