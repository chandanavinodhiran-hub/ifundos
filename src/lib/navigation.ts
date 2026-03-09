import {
  LayoutDashboard,
  Search,
  FileText,
  FolderKanban,
  GitPullRequestArrow,
  Users,
  Settings,
  TrendingUp,
  Building2,
  Scale,
  Wallet,
  Landmark,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Sidebar navigation items per user role */
export const roleNavigation: Record<string, NavItem[]> = {
  FUND_MANAGER: [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "RFPs", href: "/dashboard/rfps", icon: FileText },
    { label: "Pipeline", href: "/dashboard/applications", icon: GitPullRequestArrow },
    { label: "Grants", href: "/dashboard/grants", icon: Landmark },
    { label: "Impact", href: "/dashboard/impact", icon: TrendingUp },
  ],
  CONTRACTOR: [
    { label: "Home", href: "/contractor", icon: LayoutDashboard },
    { label: "Opportunities", href: "/contractor/rfps", icon: Search },
    { label: "Applications", href: "/contractor/applications", icon: FileText },
    { label: "Contracts", href: "/contractor/contracts", icon: FolderKanban },
    { label: "Profile", href: "/contractor/profile", icon: UserCircle },
  ],
  AUDITOR: [
    { label: "Home", href: "/audit", icon: LayoutDashboard },
    { label: "Programs", href: "/audit/programs", icon: Building2 },
    { label: "Decisions", href: "/audit/decisions", icon: Scale },
    { label: "Disbursements", href: "/audit/disbursements", icon: Wallet },
  ],
  ADMIN: [
    { label: "Home", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Programs", href: "/admin/programs", icon: Building2 },
    { label: "System", href: "/admin/system", icon: Settings },
  ],
};

/** Human-readable role labels */
export const roleLabels: Record<string, string> = {
  CONTRACTOR: "Contractor",
  FUND_MANAGER: "Fund Manager",
  ADMIN: "Administrator",
  AUDITOR: "Auditor",
};

/** Badge color per role */
export const roleBadgeVariant: Record<string, string> = {
  CONTRACTOR: "bg-slate-100 text-slate-700",
  FUND_MANAGER: "bg-violet-100 text-violet-700",
  ADMIN: "bg-slate-800 text-white",
  AUDITOR: "bg-amber-100 text-amber-700",
};
