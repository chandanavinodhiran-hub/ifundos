"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NeuProgress } from "@/components/ui/neu-progress";
import { NeuToggle } from "@/components/ui/neu-toggle";
import { ScoreWell } from "@/components/ui/score-well";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Loader2,
  Search,
  AlertCircle,
  Clock,
  Check,
  ClipboardList,
  ExternalLink,
  Sprout,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";


/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ApplicationData {
  id: string;
  rfpId: string;
  status: string;
  proposedBudget: number;
  compositeScore: number | null;
  dimensionScores: string | null;
  confidenceLevels: string | null;
  aiFindings: string | null;
  questionnaireStatus: string;
  submittedAt: string | null;
  createdAt: string;
  proposalData: string | null;
  rfp: {
    title: string;
    deadline: string | null;
    status: string;
  };
  decisionPacket: {
    recommendation: string | null;
    executiveSummary: string | null;
    narrative: string | null;
    strengths: string | null;
    risks: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const LIFECYCLE_NODES = ["Submitted", "Scored", "Review", "Decision"] as const;

type NodeState = "completed" | "current" | "scoring" | "future" | "awarded" | "rejected";

function getNodeStates(status: string): NodeState[] {
  switch (status) {
    case "DRAFT":
      return ["future", "future", "future", "future"];
    case "SUBMITTED":
      return ["completed", "future", "future", "future"];
    case "SCORING":
      return ["completed", "scoring", "future", "future"];
    case "IN_REVIEW":
    case "SHORTLISTED":
    case "QUESTIONNAIRE_PENDING":
    case "QUESTIONNAIRE_SUBMITTED":
      return ["completed", "completed", "current", "future"];
    case "APPROVED":
      return ["completed", "completed", "completed", "awarded"];
    case "REJECTED":
      return ["completed", "completed", "completed", "rejected"];
    default:
      return ["completed", "future", "future", "future"];
  }
}

function getAccent(status: string): string {
  if (["APPROVED"].includes(status)) return "accent-left-green";
  if (["REJECTED"].includes(status)) return "accent-left-critical";
  if (["QUESTIONNAIRE_PENDING"].includes(status)) return "accent-left-green";
  if (["SCORING"].includes(status)) return "accent-left-green";
  return "accent-left-green";
}

function getStatusBadge(status: string): { label: string; variant: "neu-gold" | "neu-verified" | "neu-amber" | "neu-critical" | "neu" } {
  switch (status) {
    case "SUBMITTED": return { label: "Submitted", variant: "neu" };
    case "SCORING": return { label: "AI Scoring", variant: "neu-gold" };
    case "IN_REVIEW": return { label: "In Review", variant: "neu-gold" };
    case "SHORTLISTED": return { label: "Shortlisted", variant: "neu-verified" };
    case "QUESTIONNAIRE_PENDING": return { label: "Questionnaire", variant: "neu-amber" };
    case "QUESTIONNAIRE_SUBMITTED": return { label: "Questionnaire Done", variant: "neu-verified" };
    case "APPROVED": return { label: "Approved", variant: "neu-verified" };
    case "REJECTED": return { label: "Not Selected", variant: "neu-critical" };
    default: return { label: status.replace(/_/g, " "), variant: "neu" };
  }
}

function safeJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1 week ago";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ContractorApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => setApplications(data.applications || []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "active") {
      return applications.filter((a) => !["DRAFT", "REJECTED", "APPROVED"].includes(a.status));
    }
    return applications;
  }, [applications, filter]);

  const activeCount = applications.filter((a) => !["DRAFT", "REJECTED"].includes(a.status)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(75, 165, 195, 0.7)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertCircle className="w-8 h-8 text-critical" />
        <p className="text-sovereign-stone text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 contractor-page-scroll">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(30, 34, 53, 0.4)" }}>
            Applications
          </p>
          <h1 className="text-xl font-extrabold text-sovereign-charcoal">
            My Applications
          </h1>
        </div>
        <Badge variant="neu" className="text-[11px] font-bold mt-1">
          {activeCount} active
        </Badge>
      </div>

      {/* ── Toggle ─────────────────────────────────────────────── */}
      <NeuToggle
        options={[
          { label: "Active", value: "active", count: activeCount },
          { label: "All", value: "all", count: applications.length },
        ]}
        value={filter}
        onChange={setFilter}
        className="w-full"
      />

      {/* ── Card Stack ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={filter === "active" ? "No active applications" : "No applications yet"}
          description={
            filter === "active"
              ? "All your applications have been decided. Switch to \"All\" to see them."
              : "Browse open RFPs to submit your first proposal."
          }
          action={
            filter === "all" ? (
              <Button variant="neu-gold" onClick={() => router.push("/contractor/rfps")}>
                Browse Opportunities
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              isExpanded={expandedId === app.id}
              onToggle={() => setExpandedId(expandedId === app.id ? null : app.id)}
              onNavigate={(href) => router.push(href)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Application Card                                                    */
/* ------------------------------------------------------------------ */

function ApplicationCard({
  app,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  app: ApplicationData;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
}) {
  const nodeStates = getNodeStates(app.status);
  const statusBadge = getStatusBadge(app.status);
  const accent = getAccent(app.status);
  const scores = safeJSON<Record<string, number>>(app.dimensionScores, {});
  const strengths = safeJSON<string[]>(app.decisionPacket?.strengths, []);
  const risks = safeJSON<string[]>(app.decisionPacket?.risks, []);
  const isDecided = ["APPROVED", "REJECTED"].includes(app.status);

  /* ── Navigator Video State ── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryGlow, setSummaryGlow] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cueTriggered = useRef<Set<number>>(new Set());

  /* Cuepoint timestamps — adjust after watching the actual HeyGen video */
  const cuepoints = useMemo(() => [
    { time: 5, target: "impact-bar" },
    { time: 10, target: "procurement-bar" },
    { time: 16, target: "vision-bar" },
    { time: 24, target: "viability-bar" },
  ], []);

  const highlightElement = useCallback((targetId: string) => {
    const el = document.querySelector(`[data-cue="${targetId}"]`);
    if (el) {
      el.classList.add("cue-highlight");
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => el.classList.remove("cue-highlight"), 1500);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setCurrentTime(t);
    setProgress(video.duration > 0 ? (t / video.duration) * 100 : 0);
    cuepoints.forEach((cue) => {
      if (t >= cue.time && t < cue.time + 0.5 && !cueTriggered.current.has(cue.time)) {
        cueTriggered.current.add(cue.time);
        highlightElement(cue.target);
      }
    });
  }, [cuepoints, highlightElement]);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hasEnded) {
      video.currentTime = 0;
      cueTriggered.current.clear();
      setHasEnded(false);
    }
    video.play();
    setIsPlaying(true);
    setHasStarted(true);
  }, [hasEnded]);

  const handlePause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setHasEnded(true);
    setSummaryGlow(true);
    setTimeout(() => setSummaryGlow(false), 1500);
  }, []);

  const handleVideoAreaTap = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* Score bar color helper */
  const scoreBarVariant = (val: number): "gold" | "amber" | "critical" => {
    if (val >= 85) return "gold";
    if (val >= 70) return "amber";
    return "critical";
  };

  return (
    <Card
      variant="neu-raised"
      className={cn(
        "overflow-hidden transition-all duration-300",
        accent,
        !isExpanded && !isDecided && "neu-press",
        isDecided && app.status === "REJECTED" && "opacity-[0.45]"
      )}
    >
      {/* ── Collapsed top section ── */}
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] text-sovereign-charcoal leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {app.rfp.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusBadge.variant} className="text-[10px] neu-badge-inset">
                {statusBadge.label}
              </Badge>
              {app.submittedAt && (
                <span className="text-[11px] font-mono text-sovereign-stone">
                  {getRelativeTime(app.submittedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {app.compositeScore != null ? (
              <ScoreWell score={app.compositeScore} size="sm" animated />
            ) : app.status === "SCORING" ? (
              <div className="score-well-sm">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(75, 165, 195, 0.7)" }} />
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Lifecycle Track ── */}
        <div className="mt-4 mb-1">
          <div className="flex items-center justify-between px-1">
            {LIFECYCLE_NODES.map((label, idx) => {
              const state = nodeStates[idx];
              const dotSize = (state === "completed" || state === "awarded") ? 28
                : (state === "current" || state === "scoring") ? 32
                : 24;
              return (
                <div key={label} className="flex items-center" style={{ flex: idx < LIFECYCLE_NODES.length - 1 ? "1 1 0" : "0 0 auto" }}>
                  {/* Node */}
                  <div className="flex flex-col items-center" style={{ width: 36 }}>
                    <div
                      className={cn(
                        "rounded-full flex items-center justify-center transition-all relative",
                      )}
                      style={{ width: dotSize, height: dotSize, ...nodeStyle(state) }}
                    >
                      {(state === "completed" || state === "awarded") && (
                        <Check className="text-white" style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                      )}
                      {(state === "current" || state === "scoring") && (
                        <div
                          className="rounded-full tracker-dot-pulse"
                          style={{
                            position: "absolute",
                            top: 7,
                            left: 7,
                            right: 7,
                            bottom: 7,
                            background: "rgba(75, 165, 195, 0.8)",
                            boxShadow: "0 0 8px rgba(75, 165, 195, 0.3)",
                          }}
                        />
                      )}
                      {state === "future" && (
                        <div
                          className="rounded-full"
                          style={{
                            position: "absolute",
                            top: 7,
                            left: 7,
                            right: 7,
                            bottom: 7,
                            background: "rgba(30, 34, 53, 0.12)",
                            borderRadius: "50%",
                          }}
                        />
                      )}
                      {state === "rejected" && (
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#9c4a4a" }} />
                      )}
                    </div>
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wide mt-1.5 text-center leading-none"
                      style={{
                        color: state === "completed" || state === "awarded" ? "#4a7c59"
                          : state === "current" || state === "scoring" ? "rgba(75, 165, 195, 0.8)"
                          : state === "rejected" ? "#9c4a4a"
                          : "rgba(30, 34, 53, 0.35)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                  {/* Connecting line */}
                  {idx < LIFECYCLE_NODES.length - 1 && (
                    <div
                      className="h-[3px] flex-1 mx-1 rounded-full"
                      style={lineStyle(nodeStates[idx], nodeStates[idx + 1])}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Score row ── */}
      {app.compositeScore != null && !isExpanded && (
        <div className="mx-4 mb-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-[18px]" style={{ background: "rgba(75, 165, 195, 0.06)", border: "1px solid rgba(75, 165, 195, 0.12)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[24px] font-extrabold font-sans" style={{ color: "rgba(75, 165, 195, 0.8)" }}>
                {Math.round(app.compositeScore)}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(30, 34, 53, 0.4)" }}>
                AI Score
              </span>
            </div>
            {app.submittedAt && (
              <span className="text-[11px] font-mono text-sovereign-stone">
                {new Date(app.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Expanded content ── */}
      <div
        className={cn("overflow-hidden transition-all ease-out", isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}
        style={{ transitionDuration: "0.35s" }}
      >
        <div className="border-t border-neu-dark/30 mx-4" />
        <div className="px-4 pb-5 pt-4 space-y-4">

          {/* ════════ NAVIGATOR VIDEO BRIEFING CARD ════════ */}
          {app.compositeScore != null && (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                borderTop: "1.5px solid rgba(255, 255, 255, 0.8)",
                borderLeft: "1.5px solid rgba(255, 255, 255, 0.7)",
                borderBottom: "1.5px solid rgba(255, 255, 255, 0.15)",
                borderRight: "1.5px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "10px 10px 25px rgba(155, 161, 180, 0.4), -10px -10px 25px rgba(255, 255, 255, 0.8)",
                borderRadius: 20,
                padding: 20,
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <Sprout className="w-[18px] h-[18px]" style={{ color: "rgba(74, 140, 106, 0.7)" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2.5, color: "rgba(30, 34, 53, 0.55)", textTransform: "uppercase" as const }}>
                    Navigator Video Briefing
                  </span>
                </div>
                {duration > 0 && (
                  <span
                    style={{
                      background: "rgba(75, 165, 195, 0.08)",
                      border: "1px solid rgba(75, 165, 195, 0.12)",
                      borderRadius: 12,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "rgba(75, 165, 195, 0.7)",
                    }}
                  >
                    {formatTime(duration)}
                  </span>
                )}
              </div>

              {/* Video Area */}
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "16 / 9", borderRadius: 14, background: "#0d1117" }}
                onClick={(e) => { e.stopPropagation(); handleVideoAreaTap(); }}
              >
                <video
                  ref={videoRef}
                  src="/videos/navigator-omar-feedback.mp4"
                  preload="metadata"
                  playsInline
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                  onEnded={handleVideoEnd}
                  onSeeked={() => cueTriggered.current.clear()}
                />

                {/* Play Button Overlay — poster / replay state */}
                {(!hasStarted || hasEnded) && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center z-10"
                    style={{ background: "rgba(0, 0, 0, 0.35)" }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                      className="cursor-pointer"
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.9)",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        animation: "playPulse 2.5s ease infinite",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <polygon points="0,0 0,20 16,10" fill="rgba(75, 165, 195, 0.9)" />
                      </svg>
                    </button>
                    <span
                      style={{
                        marginTop: 12,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "white",
                        textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {hasEnded ? "Replay briefing" : "Watch your AI briefing"}
                    </span>
                  </div>
                )}

                {/* Custom Controls Bar */}
                {hasStarted && !hasEnded && (
                  <div
                    className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-3"
                    style={{
                      background: "linear-gradient(transparent, rgba(0, 0, 0, 0.5))",
                      padding: "12px 16px",
                      opacity: showControls || !isPlaying ? 1 : 0,
                      transition: "opacity 200ms ease",
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); if (isPlaying) { handlePause(); } else { handlePlay(); } }}
                      className="cursor-pointer"
                      style={{ background: "none", border: "none", padding: 0 }}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" style={{ color: "white" }} />
                      ) : (
                        <Play className="w-5 h-5" style={{ color: "white" }} />
                      )}
                    </button>

                    {/* Progress bar */}
                    <div
                      className="flex-1 relative cursor-pointer"
                      style={{ height: 4, background: "rgba(255, 255, 255, 0.2)", borderRadius: 2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        if (videoRef.current) videoRef.current.currentTime = pct * videoRef.current.duration;
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: "100%",
                          background: "rgba(75, 165, 195, 0.9)",
                          borderRadius: 2,
                          transition: "width 100ms linear",
                        }}
                      />
                    </div>

                    <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.6)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }}
                      className="cursor-pointer"
                      style={{ background: "none", border: "none", padding: 0 }}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" style={{ color: "white" }} />
                      ) : (
                        <Volume2 className="w-5 h-5" style={{ color: "white" }} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Written Summary Toggle */}
              <div className="mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setSummaryOpen(!summaryOpen); }}
                  className={cn("w-full flex items-center justify-between cursor-pointer", summaryGlow && "summary-glow")}
                  style={{
                    background: "rgba(228, 231, 238, 0.4)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "rgba(30, 34, 53, 0.5)",
                  }}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Read written summary
                  </span>
                  {summaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {summaryOpen && (
                  <div style={{ padding: 16, fontSize: 13, fontWeight: 400, color: "rgba(30, 34, 53, 0.65)", lineHeight: 1.6 }}>
                    <p style={{ marginBottom: 12 }}>
                      Your overall score is 87 out of 100 — Recommend tier. Your Impact score of 89 reflects
                      solid survival rate projections and your native species focus is exactly what the committee
                      wants to see.
                    </p>
                    <p>
                      Two areas need attention: your pricing of 25M SAR is 25% above the market median of
                      18–20M SAR — we recommend revising to 19.5M SAR. Additionally, your team lacks a dedicated
                      hydrologist, which the committee will likely question given Tabuk&apos;s water scarcity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score Dimension Bars with data-cue attributes */}
          {Object.keys(scores).length > 0 && (
            <div className="stagger-bars space-y-2.5">
              {[
                { key: "procurement", label: "Procurement", delay: 0, cue: "procurement-bar" },
                { key: "vision", label: "Vision", delay: 120, cue: "vision-bar" },
                { key: "viability", label: "Viability", delay: 240, cue: "viability-bar" },
                { key: "impact", label: "Impact", delay: 360, cue: "impact-bar" },
              ].map((dim) => (
                <div key={dim.key} data-cue={dim.cue} style={{ borderRadius: 8 }}>
                  <NeuProgress
                    value={scores[dim.key] ?? 0}
                    label={dim.label}
                    showValue
                    delay={dim.delay}
                    variant={scoreBarVariant(scores[dim.key] ?? 0)}
                    size="sm"
                    groove
                  />
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Areas to Strengthen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {strengths.length > 0 && (
              <div className="accent-bar-verified pl-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#4a7c59" }}>
                  Strengths
                </p>
                {strengths.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-xs text-sovereign-stone leading-relaxed">&bull; {s}</p>
                ))}
              </div>
            )}
            {risks.length > 0 && (
              <div className="accent-bar-amber pl-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "rgba(75, 165, 195, 0.7)" }}>
                  Areas to Strengthen
                </p>
                {risks.slice(0, 3).map((r, i) => (
                  <p key={i} className="text-xs text-sovereign-stone leading-relaxed">&bull; {r}</p>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {(app.questionnaireStatus === "PENDING" || app.status === "QUESTIONNAIRE_PENDING") && (
              <Button
                variant="neu-gold"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onNavigate(`/contractor/applications/${app.id}/questionnaire`); }}
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                Complete Questionnaire
              </Button>
            )}
            <Button
              variant="neu-outline"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); onNavigate(`/contractor/rfps/${app.rfpId}`); }}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View RFP
            </Button>
          </div>

          {/* Expected timeline hint */}
          {!isDecided && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-neu-inset bg-neu-base">
              <Clock className="w-3.5 h-3.5 text-sovereign-stone" />
              <span className="text-[11px] text-sovereign-stone">
                Typically 5–10 business days for review
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Visual helpers                                                      */
/* ------------------------------------------------------------------ */

function nodeStyle(state: NodeState): React.CSSProperties {
  switch (state) {
    case "completed":
    case "awarded":
      return { background: "rgba(74, 140, 106, 0.9)" };
    case "current":
    case "scoring":
      return {
        position: "relative",
        background: "rgba(228, 231, 238, 0.6)",
        boxShadow: "3px 3px 8px rgba(155, 161, 180, 0.3), -3px -3px 8px rgba(255, 255, 255, 0.7)",
      };
    case "rejected":
      return {
        background: "rgba(228, 231, 238, 0.5)",
        boxShadow: "inset 3px 3px 8px rgba(155, 161, 180, 0.3), inset -3px -3px 8px rgba(255, 255, 255, 0.6)",
      };
    case "future":
    default:
      return {
        background: "rgba(228, 231, 238, 0.5)",
        boxShadow: "inset 3px 3px 8px rgba(155, 161, 180, 0.3), inset -3px -3px 8px rgba(255, 255, 255, 0.6)",
        position: "relative",
      };
  }
}

function lineStyle(from: NodeState, to: NodeState): React.CSSProperties {
  if (from === "completed" && (to === "completed" || to === "awarded")) {
    return { background: "rgba(74, 140, 106, 0.6)" };
  }
  if (from === "completed" && (to === "current" || to === "scoring")) {
    return { background: "linear-gradient(to right, rgba(74, 140, 106, 0.6), rgba(75, 165, 195, 0.6))" };
  }
  if (from === "completed" && to === "rejected") {
    return { background: "linear-gradient(to right, rgba(74, 140, 106, 0.6), #9c4a4a)" };
  }
  return {
    background: "rgba(228, 231, 238, 0.5)",
    boxShadow: "inset 1px 1px 3px rgba(155, 161, 180, 0.25), inset -1px -1px 3px rgba(255, 255, 255, 0.5)",
  };
}

/* Removed: contractorFeedbackTitle / contractorFeedbackBody — replaced by Navigator Video Briefing */
