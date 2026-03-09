"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Shield,
  Lock,
  Building2,
  User,
  MapPin,
  Calendar,
  Award,
  ShieldCheck,
  Check,
} from "lucide-react";

/* ================================================================== */
/* Contractor Profile — Organization Details + ALIN Secure Credentials */
/* ================================================================== */

/* Demo pre-fill credentials */
const DEMO_CREDENTIALS = {
  bankName: "Saudi National Bank",
  accountNumber: "01-7657883",
  routingNumber: "54500076",
  iban: "SA03 8000 0000 6080 1016 7519",
  taxId: "300-456-789",
};

const STORAGE_KEY = "ifundos-alin-encoded";

const FIELD_META = [
  { key: "bankName" as const, label: "Bank Name" },
  { key: "accountNumber" as const, label: "Account Number" },
  { key: "routingNumber" as const, label: "Routing Number" },
  { key: "iban" as const, label: "IBAN" },
  { key: "taxId" as const, label: "Tax ID" },
];

/* Characters used for the scramble phase — Arabic + math + block chars */
const SCRAMBLE_CHARS = "ﺡﻌﻅﻋﻉﺕﺹ∫∑∂√∏∅∈∩∪≠≡±×÷░▒▓█▀▄▌▐■□▣▤▥▦▧▨▩";

function generateScramble(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++)
    s += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
  return s;
}

/* Visual variants — sweep + hue timing + texture slice per field */
const FIELD_VARIANTS = [
  { sweepDur: "4s",   sweepDelay: "0s",   hueAngle: "135deg", bgPos: "0% 10%" },
  { sweepDur: "4.5s", sweepDelay: "0.8s", hueAngle: "160deg", bgPos: "20% 40%" },
  { sweepDur: "3.8s", sweepDelay: "1.5s", hueAngle: "110deg", bgPos: "50% 70%" },
  { sweepDur: "5s",   sweepDelay: "0.3s", hueAngle: "180deg", bgPos: "70% 20%" },
  { sweepDur: "4.2s", sweepDelay: "2s",   hueAngle: "145deg", bgPos: "90% 60%" },
];

type FieldPhase = "idle" | "blur" | "scramble" | "dissolve" | "done";

export default function ContractorProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  /* ── State machine: "empty" → "form" → "encoding" → "encoded" ── */
  const [credState, setCredState] = useState<
    "empty" | "form" | "encoding" | "encoded"
  >("empty");
  const [formData, setFormData] = useState(DEMO_CREDENTIALS);

  /* Encoding animation state */
  const [fieldPhases, setFieldPhases] = useState<FieldPhase[]>(
    Array(5).fill("idle"),
  );
  const [scrambleTexts, setScrambleTexts] = useState<string[]>(
    Array(5).fill(""),
  );
  const [showFlash, setShowFlash] = useState(false);
  const [buttonSecured, setButtonSecured] = useState(false);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Check localStorage for pre-encoded state (demo) */
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setCredState("encoded");
    } catch {
      /* SSR guard */
    }
  }, []);

  /* ── Encoding animation orchestrator ────────────────────────── */
  useEffect(() => {
    if (credState !== "encoding") return;

    // Clear previous timers
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (scrambleRef.current) clearInterval(scrambleRef.current);

    const schedule = (fn: () => void, ms: number) => {
      timeoutsRef.current.push(setTimeout(fn, ms));
    };

    const STAGGER = 300; // ms between fields starting

    // Phase 1: Field-by-field encoding with stagger
    for (let i = 0; i < 5; i++) {
      const base = i * STAGGER;
      schedule(
        () =>
          setFieldPhases((p) => {
            const n = [...p];
            n[i] = "blur";
            return n;
          }),
        base,
      );
      schedule(
        () =>
          setFieldPhases((p) => {
            const n = [...p];
            n[i] = "scramble";
            return n;
          }),
        base + 200,
      );
      schedule(
        () =>
          setFieldPhases((p) => {
            const n = [...p];
            n[i] = "dissolve";
            return n;
          }),
        base + 600,
      );
      schedule(
        () =>
          setFieldPhases((p) => {
            const n = [...p];
            n[i] = "done";
            return n;
          }),
        base + 800,
      );
    }

    // Scramble text cycling — 50ms refresh for rapid character change
    scrambleRef.current = setInterval(() => {
      setScrambleTexts(() =>
        Array(5)
          .fill(0)
          .map(() => generateScramble(14 + Math.floor(Math.random() * 6))),
      );
    }, 50);

    // Phase 2: Completion flash + button transform (2000ms)
    schedule(() => {
      setShowFlash(true);
      setButtonSecured(true);
    }, 2000);
    schedule(() => setShowFlash(false), 2500);

    // Phase 3: Settle into permanent encoded state (3000ms)
    schedule(() => {
      if (scrambleRef.current) clearInterval(scrambleRef.current);
      localStorage.setItem(STORAGE_KEY, "true");
      setCredState("encoded");
    }, 3000);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      if (scrambleRef.current) clearInterval(scrambleRef.current);
    };
  }, [credState]);

  function handleEncode(e: React.FormEvent) {
    e.preventDefault();
    setCredState("encoding");
  }

  function resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    setCredState("empty");
    setFormData(DEMO_CREDENTIALS);
    setFieldPhases(Array(5).fill("idle"));
    setScrambleTexts(Array(5).fill(""));
    setShowFlash(false);
    setButtonSecured(false);
  }

  function prefillDemo() {
    setFormData(DEMO_CREDENTIALS);
  }

  /* ── Shared styles ─────────────────────────────────────────── */
  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(30,34,53,0.45)",
    marginBottom: 6,
    display: "block",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "rgba(30,34,53,0.8)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(228, 231, 238, 0.5)",
    boxShadow:
      "inset 3px 3px 8px rgba(155, 161, 180, 0.2), inset -3px -3px 8px rgba(255, 255, 255, 0.6)",
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "rgba(30, 34, 53, 0.8)",
    outline: "none",
    transition: "all 0.3s",
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--surface-light, #E8EBF2)",
    borderRadius: 18,
    boxShadow:
      "6px 6px 16px rgba(155, 161, 180, 0.25), -6px -6px 16px rgba(255, 255, 255, 0.7)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    padding: "24px",
  };

  /* ── ALIN field custom properties per variant ────────────── */
  function alinFieldVars(variantIndex: number): React.CSSProperties {
    const v = FIELD_VARIANTS[variantIndex];
    return {
      backgroundPosition: v.bgPos,
      ["--sweep-dur" as string]: v.sweepDur,
      ["--sweep-delay" as string]: v.sweepDelay,
      ["--hue-angle" as string]: v.hueAngle,
    };
  }

  /* ── Render helper: encoding animation field ─────────────── */
  function renderEncodingField(index: number) {
    const phase = fieldPhases[index];
    const meta = FIELD_META[index];
    const value = formData[meta.key];

    return (
      <div key={meta.key}>
        <label style={labelStyle}>{meta.label}</label>

        {phase === "idle" && <div style={inputStyle}>{value}</div>}

        {phase === "blur" && (
          <div
            style={{
              ...inputStyle,
              filter: "blur(5px)",
              transition: "filter 200ms ease-in",
            }}
          >
            {value}
          </div>
        )}

        {phase === "scramble" && (
          <div
            style={{
              ...inputStyle,
              fontFamily: "'Courier New', monospace",
              color: "rgba(92, 111, 181, 0.7)",
              letterSpacing: 1.5,
              fontSize: 13,
              background: "rgba(20, 24, 50, 0.06)",
              border: "1px solid rgba(92, 111, 181, 0.12)",
              boxShadow: "none",
            }}
          >
            {scrambleTexts[index]}
          </div>
        )}

        {phase === "dissolve" && (
          <div
            className="alin-field"
            style={{
              ...alinFieldVars(index),
              opacity: 0.5,
              transition: "opacity 200ms ease-in",
            }}
          />
        )}

        {phase === "done" && (
          <div
            className="alin-field"
            style={alinFieldVars(index)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 contractor-page-scroll">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "rgba(30,34,53,0.55)",
            marginBottom: 4,
          }}
        >
          PROFILE
        </p>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 300,
            color: "rgba(30,34,53,0.85)",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.2,
          }}
        >
          Your Profile
        </h1>
      </div>

      {/* ── Section 1: Organization Details ──────────────────────── */}
      <div style={cardStyle}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            color: "rgba(30,34,53,0.45)",
            marginBottom: 20,
          }}
        >
          ORGANIZATION DETAILS
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <div className="flex items-start gap-3">
            <Building2
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "rgba(30,34,53,0.3)" }}
            />
            <div>
              <span style={labelStyle}>Organization</span>
              <p style={valueStyle}>
                {user?.organizationName ?? "Tabuk Green Solutions"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "rgba(30,34,53,0.3)" }}
            />
            <div>
              <span style={labelStyle}>Representative</span>
              <p style={valueStyle}>{user?.name ?? "Omar Al-Ayed"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Award
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "rgba(30,34,53,0.3)" }}
            />
            <div>
              <span style={labelStyle}>Trust Tier</span>
              <p style={valueStyle}>Bronze · T1</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "rgba(30,34,53,0.3)" }}
            />
            <div>
              <span style={labelStyle}>Region</span>
              <p style={valueStyle}>Tabuk Province</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "rgba(30,34,53,0.3)" }}
            />
            <div>
              <span style={labelStyle}>Registered</span>
              <p style={valueStyle}>February 15, 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: ALIN Secure Financial Credentials ────────── */}
      <div style={{ ...cardStyle, position: "relative", overflow: "hidden" }}>
        {/* Flash overlay — Phase 2 completion ripple */}
        {showFlash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)",
              zIndex: 10,
              pointerEvents: "none",
              animation: "alinFlashRipple 500ms ease-out forwards",
            }}
          />
        )}

        {/* Section header — always visible */}
        <div className="flex items-center gap-2.5 mb-1">
          <Shield className="w-4 h-4 shrink-0" style={{ color: "#5C6FB5" }} />
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: "rgba(30,34,53,0.55)",
            }}
          >
            SECURE FINANCIAL CREDENTIALS
          </p>
        </div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "rgba(30,34,53,0.4)",
            marginBottom: credState === "empty" ? 16 : 20,
            paddingLeft: 26,
          }}
        >
          Protected by ALIN · Artificial Language Intelligent Notation
        </p>

        {/* ── State A: Empty — no credentials yet ─────────────── */}
        {credState === "empty" && (
          <div style={{ transition: "all 300ms ease-out" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(30,34,53,0.6)",
                lineHeight: 1.6,
                marginBottom: 20,
                paddingLeft: 26,
              }}
            >
              Your financial credentials are required for grant disbursements.
              All data is encoded into non-human-interpretable ALIN fields —
              never stored as plain text.
            </p>

            <button
              type="button"
              onClick={() => setCredState("form")}
              className="cursor-pointer"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #5C6FB5, #4A5A9B)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow:
                  "0 4px 16px rgba(92, 111, 181, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(92, 111, 181, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(92, 111, 181, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Lock className="w-4 h-4" />
              Add Financial Credentials →
            </button>
          </div>
        )}

        {/* ── State B: Input Form ─────────────────────────────── */}
        {credState === "form" && (
          <form
            onSubmit={handleEncode}
            style={{ animation: "alinExpand 300ms ease-out forwards" }}
          >
            {/* Demo pre-fill helper */}
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={prefillDemo}
                className="cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#5C6FB5",
                  background: "rgba(92, 111, 181, 0.08)",
                  border: "1px solid rgba(92, 111, 181, 0.15)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  transition: "all 0.2s",
                }}
              >
                Pre-fill Demo Data
              </button>
            </div>

            <div className="space-y-4">
              {FIELD_META.map((meta) => (
                <div key={meta.key}>
                  <label style={labelStyle}>{meta.label}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${meta.label.toLowerCase()}`}
                    value={formData[meta.key]}
                    onChange={(e) =>
                      setFormData({ ...formData, [meta.key]: e.target.value })
                    }
                    required
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="cursor-pointer"
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #5C6FB5, #4A5A9B)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
                boxShadow:
                  "0 4px 16px rgba(92, 111, 181, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(92, 111, 181, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(92, 111, 181, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Lock className="w-4 h-4" />
              Encode & Secure Credentials →
            </button>

            <p
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "rgba(30,34,53,0.35)",
                textAlign: "center",
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              Your data will be encoded into ALIN fields immediately.
              <br />
              Once encoded, the original text is permanently discarded.
            </p>
          </form>
        )}

        {/* ── State B2: Encoding Animation ────────────────────── */}
        {credState === "encoding" && (
          <div>
            <div className="space-y-4">
              {FIELD_META.map((_, i) => renderEncodingField(i))}
            </div>

            {/* Encoding / Secured button */}
            <button
              type="button"
              disabled
              style={{
                width: "100%",
                height: 48,
                borderRadius: 12,
                border: "none",
                background: buttonSecured
                  ? "linear-gradient(135deg, #2a6348, #38865f)"
                  : "linear-gradient(135deg, #5C6FB5, #4A5A9B)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
                boxShadow: buttonSecured
                  ? "0 4px 16px rgba(42, 99, 72, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)"
                  : "0 4px 16px rgba(92, 111, 181, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.5s ease",
                cursor: "default",
              }}
            >
              {buttonSecured ? (
                <>
                  <Check className="w-4 h-4" />
                  Credentials Secured
                </>
              ) : (
                <>
                  <Lock
                    className="w-4 h-4"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Encoding with ALIN…
                </>
              )}
            </button>
          </div>
        )}

        {/* ── State C: Encoded — permanent ALIN field display ─── */}
        {credState === "encoded" && (
          <div>
            {/* Status banner — green accent */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: "rgba(74, 140, 106, 0.06)",
                borderRadius: 12,
                border: "1px solid rgba(74, 140, 106, 0.12)",
                borderLeft: "3px solid rgba(74, 140, 106, 0.4)",
                marginBottom: 20,
              }}
            >
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{ color: "rgba(74, 140, 106, 0.7)" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(74, 140, 106, 0.7)",
                }}
              >
                All credentials encoded with ALIN — secure and active
              </span>
            </div>

            {/* Encoded ALIN fields */}
            <div className="space-y-4">
              {FIELD_META.map((meta, i) => (
                <div key={meta.key}>
                  {/* Label row with ENCODED badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: "rgba(30,34,53,0.45)",
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: "rgba(74, 140, 106, 0.6)",
                        letterSpacing: 1.5,
                      }}
                    >
                      · ENCODED
                    </span>
                  </div>

                  {/* ALIN dark iridescent field — CSS class handles all visuals */}
                  <div
                    className="alin-field"
                    style={alinFieldVars(i)}
                  >
                    {/* Green shield checkmark — absolute positioned */}
                    <div
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 2,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "rgba(74, 140, 106, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShieldCheck
                        className="w-3.5 h-3.5"
                        style={{ color: "rgba(74, 140, 106, 0.7)" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Demo reset link */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <button
                type="button"
                onClick={resetDemo}
                className="cursor-pointer"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(30,34,53,0.35)",
                  background: "transparent",
                  border: "1px solid rgba(30,34,53,0.1)",
                  borderRadius: 8,
                  padding: "5px 12px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(30,34,53,0.5)";
                  e.currentTarget.style.borderColor = "rgba(30,34,53,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(30,34,53,0.35)";
                  e.currentTarget.style.borderColor = "rgba(30,34,53,0.1)";
                }}
              >
                Reset for demo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
