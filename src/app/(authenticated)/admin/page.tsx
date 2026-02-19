import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FolderKanban, Shield } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">System Administration</h1>
        <p className="text-muted-foreground mt-1">
          iFundOS platform management and configuration
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Users"
          value="4"
          description="Across all roles"
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          title="Organizations"
          value="3"
          description="Registered entities"
          icon={Building2}
          color="bg-emerald-50 text-emerald-600"
        />
        <SummaryCard
          title="Active Programs"
          value="1"
          description="Funding programs"
          icon={FolderKanban}
          color="bg-amber-50 text-amber-600"
        />
        <SummaryCard
          title="Audit Events"
          value="0"
          description="Logged actions"
          icon={Shield}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Manage users, configure system settings, and monitor the audit trail.</p>
          <p>All actions within iFundOS are logged to the tamper-evident audit chain.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
