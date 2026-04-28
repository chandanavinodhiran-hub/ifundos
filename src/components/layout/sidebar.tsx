"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { roleNavigation } from "@/lib/navigation";
import Image from "next/image";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  disableMobileDrawer?: boolean;
}

/* ─── Stone Grain Texture ───────────────────────────────────────────
   Generates a static noise pattern once on mount — random single-pixel
   white dots at very low opacity. Transforms flat #141828 into polished
   dark stone / brushed metal feel.
   ──────────────────────────────────────────────────────────────────── */
function SidebarGrain({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generated = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || generated.current || width === 0 || height === 0) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    canvasRef.current.width = w;
    canvasRef.current.height = h;

    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    // Alpha value for rgba(255,255,255,0.025) = 0.025 * 255 ≈ 6
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      if (noise > 0.5) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 6;   // A — rgba(255,255,255,0.025)
      }
      // else stays transparent (0,0,0,0)
    }

    ctx.putImageData(imageData, 0, 0);
    generated.current = true;
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

export function Sidebar({ isOpen, onClose, disableMobileDrawer }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const sidebarRef = useRef<HTMLElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const [grainSize, setGrainSize] = useState({ w: 0, h: 0 });

  const role = session?.user?.role ?? "CONTRACTOR";
  const navItems = roleNavigation[role] ?? [];

  // Measure sidebar once for grain canvas
  useEffect(() => {
    if (!sidebarRef.current) return;
    const rect = sidebarRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && (sizeRef.current.w !== rect.width || sizeRef.current.h !== rect.height)) {
      sizeRef.current = { w: rect.width, h: rect.height };
      setGrainSize({ w: rect.width, h: rect.height });
    }
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/contractor" || href === "/audit" || href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Desktop sidebar — polished dark stone */}
      <aside
        ref={sidebarRef}
        className="hidden desktop:flex flex-col shrink-0"
        style={{
          width: 260,
          height: "100vh",
          background: "#141828",
          borderRight: "1px solid rgba(92, 111, 181, 0.06)",
          boxShadow: "1px 0 12px rgba(92, 111, 181, 0.04)",
          padding: "28px 18px",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          overflow: "hidden",
          zIndex: 20,
        }}
      >
        {/* Stone grain texture — static noise overlay */}
        <SidebarGrain width={grainSize.w} height={grainSize.h} />

        {/* Vertical light streak — dashboard light grazing across stone surface */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 25,
            width: 90,
            height: "100%",
            background: "linear-gradient(to right, transparent 0%, rgba(75, 90, 140, 0.025) 20%, rgba(75, 90, 140, 0.06) 50%, rgba(75, 90, 140, 0.025) 80%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Sovereign Emblem + Branding — centered vertical stack */}
        <div className="flex flex-col items-center" style={{ marginBottom: 32, position: "relative", zIndex: 1 }}>
          <div className="sidebar-emblem-breathe">
            <Image
              src="/emblem.png"
              alt="iDent.OS"
              width={64}
              height={64}
              priority
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 12 }}
            />
          </div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "1.5px",
              color: "rgba(236, 238, 244, 0.9)",
              lineHeight: 1.2,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            iDent.OS
          </h1>
          <p
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: "rgba(236, 238, 244, 0.3)",
              marginTop: 4,
              lineHeight: 1.3,
              textAlign: "center",
              letterSpacing: "0.5px",
            }}
          >
            Dental Intelligence
          </p>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1" style={{ position: "relative", zIndex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 px-4 py-3 text-[13px] font-medium cursor-pointer transition-all duration-200",
                  active
                    ? "font-semibold"
                    : "hover:bg-[rgba(255,255,255,0.04)] rounded-[4px]"
                )}
                style={
                  active
                    ? {
                        color: "rgba(236, 238, 244, 0.95)",
                        background: "rgba(92, 111, 181, 0.06)",
                        borderLeft: "3px solid #5C6FB5",
                        boxShadow: "0 0 12px rgba(92, 111, 181, 0.35)",
                        borderRadius: 0,
                        position: "relative" as const,
                      }
                    : { color: "rgba(236, 238, 244, 0.3)" }
                }
              >
                <Icon className="w-5 h-5 shrink-0" style={{
                  color: active ? "#A8B5DB" : "rgba(236, 238, 244, 0.25)",
                  filter: active ? "drop-shadow(0 0 6px rgba(92,111,181,0.3))" : "none",
                }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer — Palm emblem + branding */}
        <div className="flex flex-col items-center gap-2 mt-auto" style={{ position: "relative", zIndex: 1 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.08 }} aria-hidden="true">
            <path d="M16 28V12" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" />
            <path d="M16 12C14 8 10 5 6 4" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 12C18 8 22 5 26 4" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 14C13 10 8 8 4 8" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 14C19 10 24 8 28 8" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 16C14 13 10 12 7 12" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" fill="none" />
            <path d="M16 16C18 13 22 12 25 12" stroke="#C8CCD8" strokeWidth="0.8" strokeLinecap="round" fill="none" />
          </svg>
          <p className="sidebar-footer-text text-center" style={{ color: "rgba(200, 204, 216, 0.3)" }}>
            Powered by Iozera Technologies
          </p>
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {!disableMobileDrawer && isOpen && (
        <div
          className="fixed inset-0 z-40 desktop:hidden"
          style={{ background: "rgba(30, 34, 53, 0.5)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      {/* Mobile drawer — clean dark surface */}
      {!disableMobileDrawer && (
        <aside
          className={cn(
            "fixed left-0 top-0 h-full w-60 flex flex-col z-50 desktop:hidden transition-transform duration-300",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{
            background: "#141828",
            borderRight: "1px solid rgba(92, 111, 181, 0.06)",
            boxShadow: "20px 0 40px rgba(0,0,0,0.3)",
          }}
        >
          {/* Sovereign Emblem + Branding (mobile) */}
          <div className="flex items-center gap-3 px-4 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="shrink-0 sidebar-emblem-breathe">
              <Image
                src="/emblem.png"
                alt="iDent.OS"
                width={40}
                height={40}
                style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 8 }}
              />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 500, letterSpacing: "1px", color: "rgba(236, 238, 244, 0.9)", lineHeight: 1.2 }}>iDent.OS</h1>
              <p className="font-arabic" style={{ fontSize: 10, fontWeight: 400, color: "rgba(236, 238, 244, 0.3)", direction: "rtl", marginTop: 2 }}>Dental Intelligence</p>
            </div>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                        active
                          ? ""
                          : "hover:bg-[rgba(255,255,255,0.04)] rounded-[4px]"
                      )}
                      style={
                        active
                          ? {
                              background: "rgba(92, 111, 181, 0.06)",
                              color: "rgba(236, 238, 244, 0.95)",
                              borderLeft: "3px solid #5C6FB5",
                              boxShadow: "0 0 12px rgba(92, 111, 181, 0.35)",
                              borderRadius: 0,
                            }
                          : { color: "rgba(236, 238, 244, 0.3)" }
                      }
                    >
                      <Icon className={cn("w-5 h-5 shrink-0")} style={{ color: active ? "#A8B5DB" : "rgba(236, 238, 244, 0.25)" }} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
      )}
    </>
  );
}
