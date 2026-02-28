"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Loader2, FolderKanban, CheckCircle2, Clock } from "lucide-react";

interface AppInfo {
  id: string;
  status: string;
  proposedBudget: number;
  createdAt: string;
  rfp: { title: string };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Submitted", color: "#b87a3f" },
  SCORING: { label: "AI Scoring", color: "#b8943f" },
  IN_REVIEW: { label: "In Review", color: "#b8943f" },
  SHORTLISTED: { label: "Shortlisted", color: "#b8943f" },
  QUESTIONNAIRE_PENDING: { label: "Questionnaire Pending", color: "#b87a3f" },
  QUESTIONNAIRE_SUBMITTED: { label: "Questionnaire Submitted", color: "#b8943f" },
  APPROVED: { label: "Approved", color: "#4a7c59" },
  AWARDED: { label: "Awarded", color: "#4a7c59" },
};

function formatSAR(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

export default function ContractsPage() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications && Array.isArray(data.applications)) {
          setApps(data.applications.filter(
            (a: AppInfo) => a.status === "APPROVED" || a.status === "AWARDED"
          ));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-sovereign-gold" />
      </div>
    );
  }

  const hasContracts = apps.length > 0;

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-[100px] md:pb-0">
      {/* Header */}
      <div>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "#b8943f" }}
        >
          CONTRACTS
        </p>
        <h1 className="text-[22px] font-extrabold text-sovereign-charcoal mt-1">
          Contracts
        </h1>
        <p className="text-[13px] text-sovereign-stone mt-0.5">
          Active work and milestone delivery
        </p>
      </div>

      {hasContracts ? (
        <div className="space-y-3">
          {apps.map((app) => {
            const statusInfo = STATUS_LABELS[app.status] || { label: app.status, color: "#7a7265" };
            return (
              <Card key={app.id} variant="neu-raised" className="p-4 accent-left-green">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-sovereign-charcoal leading-snug">
                      {app.rfp.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="neu-gold">{statusInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[18px] font-mono font-bold" style={{ color: "#b8943f" }}>
                      {formatSAR(app.proposedBudget)}
                    </p>
                    <p className="text-[10px] text-sovereign-stone uppercase">SAR</p>
                  </div>
                </div>

                {/* Milestone placeholder */}
                <div className="mt-4">
                  <Card variant="neu-inset" className="p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#4a7c59" }} />
                      <div className="flex-1">
                        <p className="text-[12px] font-semibold text-sovereign-charcoal">Contract awarded</p>
                        <p className="text-[11px] text-sovereign-stone">Milestones will appear once the fund manager sets them up</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No contracts yet"
          description="When your application is approved, your contract with milestone schedule will appear here."
        />
      )}

      {/* Pipeline info — show non-approved apps */}
      {!hasContracts && (
        <PipelineStatus />
      )}
    </div>
  );
}

function PipelineStatus() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.applications && Array.isArray(data.applications)) {
          setApps(data.applications.filter(
            (a: AppInfo) => !["DRAFT", "REJECTED", "APPROVED", "AWARDED"].includes(a.status)
          ));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || apps.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-sovereign-stone">
        In the pipeline
      </p>
      {apps.slice(0, 3).map((app) => {
        const statusInfo = STATUS_LABELS[app.status] || { label: app.status, color: "#7a7265" };
        return (
          <Card key={app.id} variant="neu-inset" className="p-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 shrink-0" style={{ color: statusInfo.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-sovereign-charcoal truncate">{app.rfp.title}</p>
                <p className="text-[11px] text-sovereign-stone">{statusInfo.label}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
