"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

/* ── Canvas-based forest background (client only, no SSR) ──────── */
const ForestCanopy = dynamic(() => import("@/components/ForestCanopy"), {
  ssr: false,
});

export default function RegisterPage() {
  return <RegisterForm />;
}

/* ================================================================== */
/* Registration Form                                                    */
/* ================================================================== */

function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    organizationName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /* Custom cursor dot — same as login */
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          organizationName: form.organizationName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login?registered=true"), 1200);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  /* ── Shared input styling ─────────────────────────────────────── */
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 9.5,
    fontWeight: 600,
    color: "rgba(170,200,170,0.4)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  };

  const inputWrapStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(90,150,90,0.08)",
    borderRadius: 11,
    padding: "0 13px",
    transition: "all 0.3s",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 0",
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: "rgba(210,230,210,0.8)",
    cursor: "none",
  };

  const iconProps = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "rgba(170,200,170,0.22)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    style: { marginRight: 9, flexShrink: 0 } as React.CSSProperties,
  };

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
      {/* Full-screen animated forest canopy — same as login */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <ForestCanopy />
      </div>

      {/* Card wrapper — centered on desktop, bottom-sheet on mobile */}
      <div
        className="register-card-wrapper"
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
          className="forest-card-in register-card"
          style={{
            width: "100%",
            maxWidth: 440,
            padding: "32px 40px 36px",
            borderRadius: 20,
            background: "rgba(6, 16, 8, 0.6)",
            backdropFilter: "blur(50px) saturate(1.3)",
            WebkitBackdropFilter: "blur(50px) saturate(1.3)",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* ── Logo ──────────────────────────────────────────────── */}
          <div className="forest-fade-in" style={{ textAlign: "center", animationDelay: "0.15s" }}>
            <img
              src="/emblem.png"
              alt="iDent.OS"
              width={52}
              height={52}
              className="emblem-breathe"
              style={{
                display: "block",
                margin: "0 auto 10px",
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "rgba(255,255,255,0.10)",
                padding: 8,
              }}
            />
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 28,
                fontWeight: 300,
                color: "rgba(230, 228, 240, 0.90)",
                letterSpacing: 3,
                textShadow: "0 0 30px rgba(130, 100, 220, 0.08)",
                marginBottom: 4,
              }}
            >
              iDent.OS
</div>
            <div
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                marginBottom: 28,
              }}
            >
              Contractor Registration
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
                marginBottom: 14,
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

          {/* ── Success message ──────────────────────────────────── */}
          {success && (
            <div
              style={{
                background: "rgba(42, 99, 72, 0.2)",
                border: "1px solid rgba(42, 99, 72, 0.3)",
                borderRadius: 11,
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "rgba(160, 230, 180, 0.85)",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(120,220,150,0.7)", flexShrink: 0 }} />
              Account created! Redirecting to sign in…
            </div>
          )}

          {/* ── Form ──────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="forest-slide-up" style={{ marginBottom: 16, animationDelay: "0.2s" }}>
              <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
              <div className="forest-input-wrap" style={inputWrapStyle}>
                <svg {...iconProps}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div className="forest-slide-up" style={{ marginBottom: 16, animationDelay: "0.25s" }}>
              <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
              <div className="forest-input-wrap" style={inputWrapStyle}>
                <svg {...iconProps}>
                  <rect x="2" y="4" width="20" height="16" rx="3" />
                  <polyline points="2 4 12 13 22 4" />
                </svg>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@organization.sa"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Organization Name */}
            <div className="forest-slide-up" style={{ marginBottom: 16, animationDelay: "0.3s" }}>
              <label htmlFor="reg-org" style={labelStyle}>Organization Name</label>
              <div className="forest-input-wrap" style={inputWrapStyle}>
                <svg {...iconProps}>
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <path d="M9 22V12h6v10" />
                  <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01" />
                </svg>
                <input
                  id="reg-org"
                  type="text"
                  placeholder="Your company or entity name"
                  value={form.organizationName}
                  onChange={(e) => updateField("organizationName", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div className="forest-slide-up" style={{ marginBottom: 16, animationDelay: "0.35s" }}>
              <label htmlFor="reg-password" style={labelStyle}>Password</label>
              <div className="forest-input-wrap" style={inputWrapStyle}>
                <svg {...iconProps}>
                  <rect x="3" y="11" width="18" height="11" rx="3" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="forest-slide-up" style={{ marginBottom: 24, animationDelay: "0.4s" }}>
              <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
              <div className="forest-input-wrap" style={inputWrapStyle}>
                <svg {...iconProps}>
                  <rect x="3" y="11" width="18" height="11" rx="3" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="reg-confirm"
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Create Account button — green gradient matching the forest */}
            <button
              type="submit"
              disabled={loading || success}
              className="forest-slide-up"
              style={{
                animationDelay: "0.45s",
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #2a6348, #38865f)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: loading || success ? "not-allowed" : "none",
                opacity: loading ? 0.6 : 1,
                transition: "all 0.3s",
                boxShadow: "0 4px 20px rgba(42, 99, 72, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {success ? (
                "Redirecting…"
              ) : loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* ── Footer links ──────────────────────────────────────── */}
          <div className="forest-fade-in" style={{ textAlign: "center", marginTop: 16, animationDelay: "0.5s" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>
              Already registered?
            </p>
            <Link
              href="/login"
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                cursor: "none",
              }}
            >
              Sign in →
            </Link>
          </div>
        </div>
      </div>

      {/* Powered by — bottom center (hidden on mobile) */}
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
          animationDelay: "0.7s",
        }}
      >
        Powered by Iozera Technologies
      </div>

      {/* Custom cursor dot (hidden on mobile via CSS) */}
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
