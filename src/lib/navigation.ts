import {
  LayoutDashboard,
  Search,
  FileText,
  FolderKanban,
  Upload,
  CreditCard,
  Briefcase,
  GitPullRequest,
  Users,
  Settings,
  Shield,
  BarChart3,
  ClipboardCheck,
  Eye,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Sidebar navigation items per user role */
export const roleNavigation: Record<string, NavItem[]> = {
  CONTRACTOR: [
    { label: "Dashboard", href: "/contractor", icon: LayoutDashboard },
    { label: "Browse RFPs", href: "/contractor/rfps", icon: Search },
    { label: "My Applications", href: "/contractor/applications", icon: FileText },
    { label: "My Contracts", href: "/contractor/contracts", icon: FolderKanban },
    { label: "Evidence Upload", href: "/contractor/evidence", icon: Upload },
    { label: "Payments", href: "/contractor/payments", icon: CreditCard },
  ],
  FUND_MANAGER: [
    { label: "Portfolio Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "RFP Manager", href: "/dashboard/rfps", icon: Briefcase },
    { label: "Application Pipeline", href: "/dashboard/applications", icon: GitPullRequest },
    { label: "Active Grants", href: "/dashboard/grants", icon: FolderKanban },
    { label: "Evidence Review", href: "/dashboard/evidence", icon: Eye },
    { label: "Impact Dashboard", href: "/dashboard/impact", icon: TrendingUp },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "System Config", href: "/admin/config", icon: Settings },
    { label: "Audit Trail", href: "/admin/audit", icon: Shield },
  ],
  AUDITOR: [
    { label: "Dashboard", href: "/audit", icon: LayoutDashboard },
    { label: "Audit Trail", href: "/audit/trail", icon: ClipboardCheck },
    { label: "Reports", href: "/audit/reports", icon: BarChart3 },
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
  CONTRACTOR: "bg-emerald-100 text-emerald-800",
  FUND_MANAGER: "bg-blue-100 text-blue-800",
  ADMIN: "bg-purple-100 text-purple-800",
  AUDITOR: "bg-amber-100 text-amber-800",
};
