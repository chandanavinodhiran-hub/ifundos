"use client";

import { useSession, signOut } from "next-auth/react";
import { roleLabels, roleBadgeVariant } from "@/lib/navigation";
import { LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;

  const role = user?.role ?? "";
  const roleLabel = roleLabels[role] ?? role;
  const badgeClass = roleBadgeVariant[role] ?? "bg-gray-100 text-gray-800";

  return (
    <header className="h-16 bg-white border-b border-surface-300 flex items-center justify-between px-6 shrink-0">
      {/* Left: Page context */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span>{user?.organizationName ?? "iFundOS"}</span>
      </div>

      {/* Right: User info + logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground leading-tight">
            {user?.name ?? "User"}
          </p>
          <span
            className={cn(
              "inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5",
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
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
