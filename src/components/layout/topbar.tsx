"use client";

import { useSession, signOut } from "next-auth/react";
import { roleLabels, roleBadgeVariant } from "@/lib/navigation";
import { LogOut, Building2, Menu, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const role = user?.role ?? "";
  const roleLabel = roleLabels[role] ?? role;
  const badgeClass = roleBadgeVariant[role] ?? "bg-gray-100 text-gray-800";
  const isFundManager = role === "FUND_MANAGER";
  const isContractor = role === "CONTRACTOR";
  const isAuditor = role === "AUDITOR";
  const isAdmin = role === "ADMIN";
  const useTabBar = isFundManager || isContractor || isAuditor || isAdmin;

  return (
    <header className={cn(
      "h-14 md:h-16 border-b flex items-center justify-between px-3 md:px-6 shrink-0",
      useTabBar
        ? "bg-neu-light border-neu-dark/50"
        : "bg-sovereign-cream border-sovereign-warm/20"
    )}>
      {/* Left: Hamburger (only for roles without tab bar) + context */}
      <div className="flex items-center gap-2 text-sm text-sovereign-stone min-w-0">
        {!useTabBar && (
          <button
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

      {/* Right: User info + logout */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Mobile: avatar initial circle for roles with tab bar */}
        {useTabBar ? (
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-full bg-neu-dark shadow-neu-inset flex items-center justify-center">
              <span className="text-xs font-bold text-sovereign-charcoal">
                {(user?.name ?? "U")[0]}
              </span>
            </div>
          </div>
        ) : null}

        {/* Desktop: full user info */}
        <div className={cn("text-right", useTabBar ? "hidden md:block" : "")}>
          <p className="text-sm font-medium text-sovereign-charcoal leading-tight truncate max-w-[80px] sm:max-w-none hidden sm:block">
            {user?.name ?? "User"}
          </p>
          <span
            className={cn(
              "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full sm:mt-0.5",
              useTabBar ? "bg-[rgba(184,148,63,0.12)] text-sovereign-gold" : badgeClass
            )}
          >
            {roleLabel}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title="Sign out"
          className={cn(
            "cursor-pointer h-8 w-8 sm:h-9 sm:w-9",
            useTabBar
              ? "hidden md:flex text-sovereign-stone hover:text-sovereign-charcoal hover:bg-neu-dark/30"
              : "text-sovereign-stone hover:text-sovereign-charcoal hover:bg-sovereign-parchment"
          )}
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </header>
  );
}
