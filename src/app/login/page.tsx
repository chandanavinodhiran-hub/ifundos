"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

/* ── Canvas-based forest background (client only, no SSR) ──────── */
const ForestCanopy = dynamic(() => import("@/components/ForestCanopy"), {
  ssr: false,
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/* ================================================================== */
/* Login Form                                                          */
/* ================================================================== */

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);

  const canopyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  /* Top-level cursor dot — lives above all stacking contexts */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, []);

  /** Fog dissolve transition — card fades, canopy blurs, fog rolls in → redirect */
  const playEnterTransition = useCallback((destination: string) => {
    setEntering(true);

    // After 300ms delay, begin the fog dissolve
    setTimeout(() => {
      // Card fades out — just opacity, no scaling, no movement
      if (cardRef.current) {
        cardRef.current.style.transition = "opacity 600ms ease-out";
        cardRef.current.style.opacity = "0";
      }
      // Canopy blurs — morning fog rolling through the forest
      if (canopyRef.current) {
        canopyRef.current.style.transition = "filter 1000ms ease-in-out";
        canopyRef.current.style.filter = "blur(20px)";
      }
      // Fog overlay fades in — forest dissolves toward dashboard color
      if (fogRef.current) {
        fogRef.current.style.transition = "opacity 1200ms ease-in-out";
        fogRef.current.style.opacity = "1";
      }
    }, 300);

    // At 1300ms, redirect — last frame is blurred canopy barely visible through fog
    setTimeout(() => {
      router.push(destination);
      router.refresh();
    }, 1300);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        let destination = "/";

        if (callbackUrl) {
          destination = callbackUrl;
        } else {
          const res = await fetch("/api/auth/session");
          const session = await res.json();
          const role = session?.user?.role;

          if (role === "FUND_MANAGER" || role === "ADMIN" || role === "CONTRACTOR" || role === "AUDITOR") {
            fetch("/api/stats").catch(() => {/* fire-and-forget */});
          }

          switch (role) {
            case "CONTRACTOR": destination = "/contractor"; break;
            case "FUND_MANAGER": destination = "/dashboard"; break;
            case "ADMIN": destination = "/admin"; break;
            case "AUDITOR": destination = "/audit"; break;
            default: destination = "/";
          }
        }

        // Play cinematic transition instead of instant redirect
        playEnterTransition(destination);
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  }

  return (
    <div
      className="login-page-root"
      style={{
        minHeight: "100vh",
        overflow: "hidden",
        fontFamily: "'DM Sans', sans-serif",
        cursor: "none",
        background: "#050c06",
      }}
    >
      {/* Full-screen animated forest canopy — wrapped for cinematic zoom */}
      <div ref={canopyRef} style={{ position: "fixed", inset: 0, transformOrigin: "center center", zIndex: 0 }}>
        <ForestCanopy />
      </div>

      {/* Card wrapper — centered on desktop, bottom-sheet on mobile */}
      <div
        className="login-card-wrapper"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* Frosted glass card */}
        <div
          ref={cardRef}
          className="forest-card-in"
          style={{
            width: "100%",
            maxWidth: 430,
            padding: "42px 36px 36px",
            borderRadius: "32px 32px 24px 24px",
            background: "rgba(6, 16, 8, 0.6)",
            backdropFilter: "blur(50px) saturate(1.3)",
            WebkitBackdropFilter: "blur(50px) saturate(1.3)",
          }}
        >
          {/* ── Logo ──────────────────────────────────────────────── */}
          <div className="forest-fade-in" style={{ textAlign: "center", marginBottom: 22, animationDelay: "0.2s" }}>
            {/* Sovereign emblem */}
            <img
              src="/emblem.png"
              alt="iDent.OS"
              width={76}
              height={76}
              className="w-[56px] h-[56px] sm:w-[76px] sm:h-[76px] emblem-breathe"
              style={{
                display: "block",
                margin: "0 auto 4px",
                borderRadius: 14,
              }}
            />

            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "clamp(28px, 7vw, 38px)",
                fontWeight: 400,
                color: "rgba(230, 228, 240, 0.90)",
                letterSpacing: 3,
                textShadow: "0 0 30px rgba(130, 100, 220, 0.08)",
                marginBottom: 2,
              }}
            >
              iDent.OS
            </div>
          </div>

          {/* ── Error message ──────────────────────────────────────── */}
          {error && (
            <div
              style={{
                background: "rgba(180, 60, 60, 0.12)",
                border: "1px solid rgba(180, 60, 60, 0.2)",
                borderRadius: 11,
                padding: "10px 14px",
                marginBottom: 17,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "rgba(255, 160, 160, 0.85)",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,120,120,0.7)", flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* ── Form ──────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="forest-slide-up" style={{ marginBottom: 17, animationDelay: "0.3s" }}>
              <label
                htmlFor="forest-email"
                style={{
                  display: "block",
                  fontSize: 9.5,
                  fontWeight: 500,
                  color: "rgba(170,200,170,0.4)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <div
                className="forest-input-wrap"
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(90,150,90,0.08)",
                  borderRadius: 11,
                  padding: "0 13px",
                  transition: "all 0.3s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(170,200,170,0.22)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 9, flexShrink: 0 }}>
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <polyline points="2 4 12 13 22 4" />
                </svg>
                <input
                  id="forest-email"
                  type="email"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "rgba(210,230,210,0.8)",
                    cursor: "none",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="forest-slide-up" style={{ marginBottom: 17, animationDelay: "0.4s" }}>
              <label
                htmlFor="forest-password"
                style={{
                  display: "block",
                  fontSize: 9.5,
                  fontWeight: 500,
                  color: "rgba(170,200,170,0.4)",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div
                className="forest-input-wrap"
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(90,150,90,0.08)",
                  borderRadius: 11,
                  padding: "0 13px",
                  transition: "all 0.3s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(170,200,170,0.22)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 9, flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="3" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="forest-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "rgba(210,230,210,0.8)",
                    cursor: "none",
                  }}
                />
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading || entering}
              className={`forest-slide-up amethyst-btn${entering ? " entering-pulse" : ""}`}
              style={{
                animationDelay: entering ? undefined : "0.5s",
                opacity: loading && !entering ? 0.6 : undefined,
              }}
            >
              {entering ? "Entering..." : loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          {/* ── Footer links ──────────────────────────────────────── */}
          <div className="forest-fade-in" style={{ textAlign: "center", marginTop: 20, animationDelay: "0.6s" }}>
            <p style={{ fontSize: 11, color: "rgba(170,200,170,0.22)", marginBottom: 2 }}>
              New to IDENT.OS?
            </p>
            <Link
              href="/register"
              style={{
                fontSize: 11,
                color: "rgba(70,160,110,0.55)",
                textDecoration: "none",
                cursor: "none",
              }}
            >
              Register your clinic →
            </Link>
          </div>
        </div>
      </div>

      {/* Fog dissolve overlay — softens forest into dashboard background */}
      <div
        ref={fogRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          opacity: 0,
          pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(232, 235, 242, 0.92) 0%, rgba(232, 235, 242, 0.88) 60%, rgba(221, 223, 232, 0.85) 100%)",
        }}
      />

      {/* Powered by — bottom center (hidden on mobile — overlaps bottom-sheet) */}
      <div
        className="forest-fade-in hidden sm:block"
        style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          fontSize: 9,
          fontWeight: 400,
          color: "rgba(255, 255, 255, 0.12)",
          letterSpacing: 1.5,
          animationDelay: "0.8s",
        }}
      >
        Powered by Iozera Technologies
      </div>

      {/* Custom cursor dot — top-level, above all stacking contexts (hidden on mobile via CSS) */}
      <div
        ref={cursorRef}
        className="login-cursor-dot"
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.5)",
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9999,
          transform: "translate(-50%,-50%)",
          boxShadow: "0 0 12px rgba(255,255,255,0.15)",
        }}
      />
    </div>
  );
}
