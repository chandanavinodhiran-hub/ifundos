"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, FileText, Calendar, AlertCircle } from "lucide-react";

interface RFP {
  id: string;
  title: string;
  description: string | null;
  eligibilityCriteria: string | null;
  deadline: string | null;
  status: string;
  program: {
    id: string;
    name: string;
  };
}

function getDaysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysLeftBadgeClass(daysLeft: number): string {
  if (daysLeft < 7) return "bg-red-100 text-red-800 border-red-200";
  if (daysLeft <= 14) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-green-100 text-green-800 border-green-200";
}

function parseEligibilityHighlights(criteria: string | null): string[] {
  if (!criteria) return [];
  try {
    const parsed = JSON.parse(criteria);
    const highlights: string[] = [];
    if (parsed.minimumCapitalization) {
      highlights.push(
        `Min capitalization: SAR ${Number(parsed.minimumCapitalization).toLocaleString()}`
      );
    }
    if (parsed.requiredCategories && Array.isArray(parsed.requiredCategories)) {
      highlights.push(`Categories: ${parsed.requiredCategories.join(", ")}`);
    }
    if (parsed.certifications && Array.isArray(parsed.certifications)) {
      highlights.push(`Certifications: ${parsed.certifications.join(", ")}`);
    }
    if (parsed.minimumTrustTier) {
      highlights.push(`Trust tier: ${parsed.minimumTrustTier}+`);
    }
    if (parsed.geographicRestrictions) {
      highlights.push(`Region: ${parsed.geographicRestrictions}`);
    }
    return highlights.slice(0, 3);
  } catch {
    return [];
  }
}

export default function BrowseRFPsPage() {
  const router = useRouter();
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  useEffect(() => {
    async function fetchRfps() {
      try {
        const res = await fetch("/api/rfps?open=true");
        if (!res.ok) throw new Error("Failed to fetch RFPs");
        const data = await res.json();
        setRfps(data.rfps || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load RFPs");
      } finally {
        setLoading(false);
      }
    }
    fetchRfps();
  }, []);

  const programs = useMemo(() => {
    const map = new Map<string, string>();
    rfps.forEach((rfp) => map.set(rfp.program.id, rfp.program.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rfps]);

  const filteredRfps = useMemo(() => {
    return rfps.filter((rfp) => {
      const matchesSearch =
        searchQuery === "" ||
        rfp.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProgram =
        programFilter === "all" || rfp.program.id === programFilter;
      return matchesSearch && matchesProgram;
    });
  }, [rfps, searchQuery, programFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Browse Open RFPs</h1>
        <p className="text-muted-foreground mt-1">
          Find and apply for available funding opportunities
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search RFPs by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filter by program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* RFP Grid */}
      {filteredRfps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No open RFPs available
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || programFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Check back later for new funding opportunities"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRfps.map((rfp) => {
            const daysLeft = getDaysLeft(rfp.deadline);
            const highlights = parseEligibilityHighlights(
              rfp.eligibilityCriteria
            );

            return (
              <Card
                key={rfp.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-teal"
                onClick={() => router.push(`/contractor/rfps/${rfp.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-navy-800 text-base truncate">
                        {rfp.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="mt-1 bg-teal-50 text-teal-700 border-teal-200 text-xs"
                      >
                        {rfp.program.name}
                      </Badge>
                    </div>
                    {daysLeft !== null && daysLeft >= 0 && (
                      <Badge
                        variant="outline"
                        className={getDaysLeftBadgeClass(daysLeft)}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        {daysLeft} days left
                      </Badge>
                    )}
                    {daysLeft !== null && daysLeft < 0 && (
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-500 border-gray-200"
                      >
                        Expired
                      </Badge>
                    )}
                  </div>

                  {rfp.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {rfp.description.length > 150
                        ? rfp.description.slice(0, 150) + "..."
                        : rfp.description}
                    </p>
                  )}

                  {highlights.length > 0 && (
                    <div className="space-y-1">
                      {highlights.map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
