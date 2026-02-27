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

  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shrink-0">
      {/* Left: Hamburger + context */}
      <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-1 md:hidden hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        {/* Mobile: show iFundOS logo center-ish */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <Hexagon className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">iFundOS</span>
        </div>
        {/* Desktop: show org name */}
        <Building2 className="w-4 h-4 hidden md:block shrink-0" />
        <span className="font-medium truncate hidden md:inline">{user?.organizationName ?? "iFundOS"}</span>
      </div>

      {/* Right: User info + logout */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900 leading-tight truncate max-w-[80px] sm:max-w-none hidden sm:block">
            {user?.name ?? "User"}
          </p>
          <span
            className={cn(
              "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full sm:mt-0.5",
              badgeClass
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
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer h-8 w-8 sm:h-9 sm:w-9"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </header>
  );
}
