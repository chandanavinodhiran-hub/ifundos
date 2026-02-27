"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, ArrowRight, FileText, CheckCircle2, CreditCard, Loader2 } from "lucide-react";

interface AppInfo {
  id: string;
  status: string;
  rfp: { title: string };
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "submitted",
  SCORING: "being scored by AI",
  IN_REVIEW: "in review",
  SHORTLISTED: "shortlisted",
  QUESTIONNAIRE_PENDING: "awaiting questionnaire completion",
  QUESTIONNAIRE_SUBMITTED: "questionnaire submitted",
  APPROVED: "approved",
};

export default function MyContractsPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications && Array.isArray(data.applications)) {
          setApps(
            data.applications.filter(
              (a: AppInfo) => a.status !== "DRAFT" && a.status !== "REJECTED"
            )
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Awarded Contracts</h1>
        <p className="text-muted-foreground mt-1">
          Manage awarded contracts and track milestone progress
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contract Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
            {/* Lifecycle visual */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap justify-center">
              <span className="w-9 h-9 rounded-full bg-leaf-100 flex items-center justify-center text-leaf-600 font-bold text-xs">
                <FolderKanban className="w-4 h-4" />
              </span>
              <span className="font-medium">Award</span>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="w-9 h-9 rounded-full bg-ocean-100 flex items-center justify-center text-ocean-600 font-bold text-xs">
                <FileText className="w-4 h-4" />
              </span>
              <span className="font-medium">Milestones</span>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="font-medium">Evidence</span>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
              <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                <CreditCard className="w-4 h-4" />
              </span>
              <span className="font-medium">Payment</span>
            </div>

            <p className="text-muted-foreground text-sm max-w-md">
              No contracts yet. When your application is approved and awarded,
              your contract with milestone schedule will appear here.
            </p>

            {/* Dynamic application status */}
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : apps.length > 0 ? (
              <div className="space-y-1.5">
                {apps.slice(0, 3).map((app) => (
                  <p key={app.id} className="text-sm text-leaf-700 bg-leaf-50 px-3 py-1.5 rounded-lg">
                    Your application for <span className="font-medium">{app.rfp.title}</span> is currently{" "}
                    <span className="font-medium">{STATUS_LABELS[app.status] || app.status.toLowerCase().replace(/_/g, " ")}</span>.
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
