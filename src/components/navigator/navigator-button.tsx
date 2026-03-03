"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { MessageSquare, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "./navigator-context";

/* ── Page-aware context hints for the Navigator popover ── */
function getContextHint(pathname: string): { title: string; description: string } {
  if (pathname === "/dashboard") return { title: "Dashboard", description: "Ask about pipeline status or next actions" };
  if (pathname.startsWith("/dashboard/rfps")) return { title: "RFPs", description: "Ask about proposals or create new RFPs" };
  if (pathname.startsWith("/dashboard/applications")) return { title: "Pipeline", description: "Ask about scores or shortlist candidates" };
  if (pathname.startsWith("/dashboard/grants")) return { title: "Grants", description: "Ask about milestones or disbursements" };
  if (pathname.startsWith("/dashboard/impact")) return { title: "Impact", description: "Ask about KPIs or environmental metrics" };
  return { title: "Navigator", description: "Ask anything about this page" };
}

/* ══════════════════════════════════════════════════════════════════
   Draw a botanical sapling on canvas — seed body, curved stem, two leaves
   Canvas: 72×72 logical pixels, HiDPI-aware
   ══════════════════════════════════════════════════════════════════ */
function drawSapling(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const W = 72;
  const H = 72;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.scale(dpr, dpr);

  const cx = W / 2;

  /* ── Ground shadow ── */
  const shadowGrad = ctx.createRadialGradient(cx, 64, 0, cx, 64, 16);
  shadowGrad.addColorStop(0, "rgba(40, 80, 45, 0.10)");
  shadowGrad.addColorStop(1, "rgba(40, 80, 45, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, 64, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  /* ── Seed body — rounded oval ── */
  const seedCY = 56;
  const seedRX = 10;
  const seedRY = 8;
  ctx.beginPath();
  ctx.ellipse(cx, seedCY, seedRX, seedRY, 0, 0, Math.PI * 2);
  const seedGrad = ctx.createRadialGradient(cx - 3, seedCY - 3, 0, cx, seedCY, seedRX);
  seedGrad.addColorStop(0, "rgba(115, 185, 120, 0.90)");
  seedGrad.addColorStop(0.4, "rgba(95, 170, 100, 0.85)");
  seedGrad.addColorStop(1, "rgba(55, 120, 65, 0.90)");
  ctx.fillStyle = seedGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(40, 95, 50, 0.25)";
  ctx.lineWidth = 0.6;
  ctx.stroke();

  /* Seed specular highlight */
  ctx.beginPath();
  ctx.ellipse(cx - 3, seedCY - 3, 4, 2.5, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fill();

  /* ── Stem — organic curved line from seed top to leaf junction ── */
  const stemBaseY = seedCY - seedRY + 1;
  const stemTopY = 22;

  /* Stem stroke — gradient from base to top */
  const stemGrad = ctx.createLinearGradient(0, stemBaseY, 0, stemTopY);
  stemGrad.addColorStop(0, "rgba(75, 145, 80, 0.80)");
  stemGrad.addColorStop(1, "rgba(90, 165, 95, 0.85)");

  /* Draw stem as a filled shape (2px wide with organic curve) */
  ctx.beginPath();
  ctx.moveTo(cx - 1, stemBaseY);
  ctx.bezierCurveTo(cx - 1.5, stemBaseY - 8, cx + 1.5, stemTopY + 8, cx + 0.5, stemTopY);
  ctx.lineTo(cx + 1.5, stemTopY);
  ctx.bezierCurveTo(cx + 2.5, stemTopY + 8, cx - 0.5, stemBaseY - 8, cx + 1, stemBaseY);
  ctx.closePath();
  ctx.fillStyle = stemGrad;
  ctx.fill();

  /* Stem highlight */
  ctx.beginPath();
  ctx.moveTo(cx + 0.3, stemBaseY);
  ctx.bezierCurveTo(cx, stemBaseY - 8, cx + 1.5, stemTopY + 8, cx + 0.8, stemTopY);
  ctx.strokeStyle = "rgba(130, 200, 140, 0.15)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* ── Left leaf — angled outward ── */
  drawLeaf(ctx, cx - 1, stemTopY + 2, -0.65, 14);

  /* ── Right leaf — angled outward (slightly different timing feel) ── */
  drawLeaf(ctx, cx + 1, stemTopY + 2, 0.55, 13);
}

/** Draw a single leaf at a junction point */
function drawLeaf(
  ctx: CanvasRenderingContext2D,
  jx: number, jy: number,
  angle: number, length: number
) {
  ctx.save();
  ctx.translate(jx, jy);
  ctx.rotate(angle);

  const lw = length * 0.35;
  const lh = length;

  /* Leaf shape — bezier teardrop */
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(lw * 0.6, -lh * 0.15, lw * 1.1, -lh * 0.45, lw * 0.4, -lh * 0.85);
  ctx.bezierCurveTo(lw * 0.1, -lh * 0.95, -lw * 0.05, -lh * 0.92, -lw * 0.2, -lh * 0.8);
  ctx.bezierCurveTo(-lw * 0.9, -lh * 0.4, -lw * 0.5, -lh * 0.12, 0, 0);
  ctx.closePath();

  /* Gradient fill */
  const leafGrad = ctx.createLinearGradient(-lw * 0.3, 0, lw * 0.5, -lh);
  leafGrad.addColorStop(0, "rgba(80, 160, 90, 0.85)");
  leafGrad.addColorStop(0.5, "rgba(65, 145, 75, 0.88)");
  leafGrad.addColorStop(1, "rgba(50, 130, 60, 0.90)");
  ctx.fillStyle = leafGrad;
  ctx.fill();

  /* Edge stroke */
  ctx.strokeStyle = "rgba(35, 95, 45, 0.25)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  /* Midrib vein */
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.bezierCurveTo(lw * 0.15, -lh * 0.3, lw * 0.1, -lh * 0.6, lw * 0.1, -lh * 0.82);
  ctx.strokeStyle = "rgba(40, 100, 50, 0.30)";
  ctx.lineWidth = 0.4;
  ctx.stroke();

  /* Specular highlight — upper portion */
  ctx.beginPath();
  ctx.ellipse(lw * 0.15, -lh * 0.55, lw * 0.3, lh * 0.12, angle * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
  ctx.fill();

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════════════ */

export function NavigatorButton() {
  const { mode, setMode, popoverOpen, setPopoverOpen } = useNavigator();
  const { data: session } = useSession();
  const pathname = usePathname();
  const _contextHint = getContextHint(pathname);
  void _contextHint;
  const [showLabel, setShowLabel] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [wiggling, setWiggling] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const saplingRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(false);

  const role = session?.user?.role ?? "FUND_MANAGER";
  const isFundManager = role === "FUND_MANAGER";

  // Draw sapling once on mount
  useEffect(() => {
    if (canvasRef.current && !drawnRef.current) {
      drawSapling(canvasRef.current);
      drawnRef.current = true;
    }
  }, []);

  // Show "Navigator" label on first visit, fade after 5s
  useEffect(() => {
    const shown = sessionStorage.getItem("navigator-label-shown");
    if (!shown) {
      setShowLabel(true);
      setLabelVisible(true);
      sessionStorage.setItem("navigator-label-shown", "1");
      const timer = setTimeout(() => {
        setLabelVisible(false);
        setTimeout(() => setShowLabel(false), 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverOpen &&
        popoverRef.current &&
        saplingRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !saplingRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen, setPopoverOpen]);

  const isActive = mode !== "closed";

  const handleSaplingClick = useCallback(() => {
    if (isActive) {
      setMode("closed");
    } else if (wiggling) {
      return;
    } else if (popoverOpen) {
      setPopoverOpen(false);
    } else {
      setWiggling(true);
      setTimeout(() => {
        setWiggling(false);
        setPopoverOpen(true);
      }, 400);
    }
  }, [isActive, wiggling, popoverOpen, setMode, setPopoverOpen]);

  return (
    <div
      className={cn(
        "fixed bottom-7 right-7 flex flex-col items-end gap-2",
        isFundManager && "hidden md:flex"
      )}
      style={{ zIndex: 510 }}
    >
      {/* Mode selector popover — compact dark AI space */}
      {popoverOpen && !isActive && (
        <div
          ref={popoverRef}
          className="mb-1.5 w-40 rounded-2xl overflow-hidden animate-fade-in-up"
          style={{
            background: "rgba(30,34,53,0.97)",
            border: "1px solid rgba(92,111,181,0.15)",
            boxShadow: "0 6px 24px rgba(30,34,53,0.5)",
          }}
        >
          <div className="p-1.5">
            <button
              onClick={() => setMode("chat")}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(92,111,181,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(92,111,181,0.12)" }}
              >
                <MessageSquare className="w-3 h-3" style={{ color: "#7B8DC8" }} />
              </div>
              <span className="font-medium text-xs" style={{ color: "var(--text-on-dark)" }}>Chat</span>
            </button>
            <button
              onClick={() => setMode("avatar")}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(92,111,181,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(92,111,181,0.12)" }}
              >
                <Eye className="w-3 h-3" style={{ color: "#7B8DC8" }} />
              </div>
              <span className="font-medium text-xs" style={{ color: "var(--text-on-dark)" }}>Launch Avatar</span>
            </button>
          </div>
        </div>
      )}

      {/* Hover label — frosted glass tag beside the sapling */}
      {hovered && !isActive && !popoverOpen && !wiggling && (
        <span
          className="whitespace-nowrap animate-fade-in-up"
          style={{
            padding: "6px 14px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.5px",
            color: "rgba(50, 110, 60, 0.85)",
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(75, 160, 85, 0.15)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          Navigator
        </span>
      )}

      {/* First-visit label — frosted glass tag */}
      {showLabel && !hovered && (
        <span
          className={cn(
            "transition-opacity duration-500 whitespace-nowrap",
            labelVisible ? "opacity-100" : "opacity-0"
          )}
          style={{
            padding: "6px 14px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.5px",
            color: "rgba(50, 110, 60, 0.85)",
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(75, 160, 85, 0.15)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <svg className="w-2.5 h-2.5 inline mr-1" viewBox="0 0 12 12"><circle cx="6" cy="6" r="2" fill="rgba(60, 140, 80, 0.7)" /></svg>
          Navigator
        </span>
      )}

      {/* Sapling — always visible, never removed from DOM */}
      <div
        ref={saplingRef}
        className={cn(
          "sapling-bob cursor-pointer relative",
          !isActive && hovered && "sapling-hovered",
          !isActive && wiggling && "sapling-wiggle"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleSaplingClick}
        role="button"
        tabIndex={0}
        aria-label={isActive ? "Close Navigator" : "Open Navigator"}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSaplingClick(); }}
      >
        <div className={cn(
          "sapling-stem-flex",
          !isActive && hovered && "sapling-hovered",
          !isActive && wiggling && "sapling-wiggle"
        )}>
          <canvas
            ref={canvasRef}
            style={{ display: "block", pointerEvents: "none" }}
          />
          {/* Leaf glow on hover */}
          <div className="sapling-leaf-glow" />
        </div>
        {/* Grounded shadow beneath sapling */}
        <div className="sapling-ground-shadow" />
        {/* Close indicator overlay when Navigator is active */}
        {isActive && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{
              background: "rgba(30, 36, 56, 0.65)",
              backdropFilter: "blur(4px)",
            }}
          >
            <X className="w-4 h-4" style={{ color: "rgba(200, 206, 230, 0.9)" }} />
          </div>
        )}
      </div>
    </div>
  );
}
