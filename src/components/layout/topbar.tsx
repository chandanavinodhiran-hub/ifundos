"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { roleLabels } from "@/lib/navigation";
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
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
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
      <header
        className="h-14 md:h-16 border-b flex items-center justify-between px-3 md:px-6 shrink-0 header-heartbeat"
        style={{
          zIndex: 100,
          background: "var(--surface-base)",
          borderColor: "rgba(255,255,255,0.25)",
        }}
      >
        {/* Left: Hamburger + context */}
        <div className="flex items-center gap-2 text-sm min-w-0" style={{ color: "var(--text-secondary)" }}>
          {!useTabBar && (
            <button
              type="button"
              onClick={onMenuToggle}
              className="p-2 -ml-1 desktop:hidden rounded-lg cursor-pointer shrink-0 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Menu className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
            </button>
          )}
          {/* Mobile + Tablet: show iFundOS logo */}
          <div className="flex items-center gap-2 desktop:hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--accent)", boxShadow: "var(--raise-sm)" }}
            >
              <Hexagon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>iFundOS</span>
          </div>
          {/* Desktop: show org name — DM Sans 11px subtle */}
          <Building2 className="w-3.5 h-3.5 hidden desktop:block shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <span className="font-medium hidden desktop:inline" style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>
            {user?.organizationName ?? "iFundOS"}
          </span>
        </div>

        {/* Right: User info + avatar */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative" ref={dropdownRef}>
          {/* Tablet+Desktop: role badge only (name shown in greeting) */}
          <div className={cn("text-right", useTabBar ? "hidden md:block" : "hidden sm:block")}>
            <span
              className="inline-block text-[9px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--bg-dark)",
                color: isAdmin ? "#64748B" : isAuditor ? "#B8953F" : "var(--accent)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "var(--press-sm)",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.5px",
              }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Avatar circle — raised */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-shadow"
            style={{
              background: "var(--surface-light)",
              boxShadow: menuOpen
                ? "var(--press)"
                : "var(--raise-sm)",
            }}
          >
            <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>{initials}</span>
          </button>

          {/* Desktop Dropdown */}
          {menuOpen && (
            <div
              className="hidden md:block absolute top-[52px] right-0 w-[280px] rounded-[20px] p-4"
              style={{
                zIndex: 9999,
                background: "var(--surface-light)",
                border: "1px solid rgba(255,255,255,0.4)",
                boxShadow: "var(--raise-lg)",
              }}
            >
              <AvatarMenuContent user={user} roleLabel={roleLabel} initials={initials} onClose={() => setMenuOpen(false)} />
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Sheet */}
      {menuOpen && mounted && createPortal(
        <div ref={sheetRef} className="md:hidden" style={{ position: "relative", zIndex: 99999 }}>
          {/* Overlay */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 99999, background: "rgba(30, 34, 53, 0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setMenuOpen(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 animate-slide-up-sheet avatar-sheet"
            style={{
              zIndex: 100000,
              background: "var(--surface-light)",
              border: "1px solid rgba(255,255,255,0.4)",
              borderBottom: "none",
              borderRadius: "24px 24px 0 0",
              padding: "16px 24px 40px",
              boxShadow: "var(--raise-lg)",
            }}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--text-muted)" }} />
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
            background: "var(--bg-dark)",
            boxShadow: "var(--press)",
          }}
        >
          <span className="text-sm font-bold" style={{ color: "var(--accent)" }}>{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-[16px]" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            {user?.name ?? "User"}
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            {roleLabel} · {user?.organizationName ?? "iFundOS"}
          </p>
          <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)" }}>
            {user?.email ?? ""}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }} />

      {/* Menu items */}
      <div className="space-y-1">
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer transition-colors"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ WebkitTapHighlightColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div className="flex items-center gap-3 pointer-events-none">
            <Settings className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>Account Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer transition-colors"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ WebkitTapHighlightColor: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div className="flex items-center gap-3 pointer-events-none">
            <Bell className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>Notification Preferences</span>
          </div>
          <ChevronRight className="w-4 h-4 pointer-events-none" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }} />

      {/* Sign Out */}
      <button
        type="button"
        className="w-full flex items-center gap-3 py-3 px-2 rounded-xl cursor-pointer transition-colors"
        onClick={handleSignOut}
        style={{ WebkitTapHighlightColor: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,80,80,0.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <LogOut className="w-4 h-4 pointer-events-none" style={{ color: "#e05555" }} />
        <span className="text-[13px] font-semibold pointer-events-none" style={{ color: "#e05555" }}>Sign Out</span>
      </button>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.25)" }} />

      {/* Footer */}
      <p className="text-[10px] text-center" style={{ color: "var(--text-tertiary)" }}>
        Powered by Iozera Technologies
      </p>
    </div>
  );
}
