"use client";

import { useEffect, useState, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
 * DOPS Pro — Dental Office Production System
 * Cinematic hero. Same design system as iFundOS page.tsx.
 * ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg: "#0A0E1A",
  navBg: "rgba(10, 14, 26, 0.85)",
  border: "rgba(230, 232, 240, 0.2)",
  borderFaint: "rgba(230, 232, 240, 0.06)",
  easeContent: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  easeHover: "cubic-bezier(0.215, 0.61, 0.355, 1)",
} as const;

const NAV_ITEMS = ["Overview", "Technology", "About", "Contact"];

/* ═══════════════════════════════════════════════════════════════════════════
 * MAIN PAGE
 * ═══════════════════════════════════════════════════════════════════════════ */
export default function DopsProPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    /* Trigger stagger sequence after mount */
    const raf = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Scroll reveal for sections below hero */
  const s2Ref = useRef<HTMLElement>(null);
  const [s2Visible, setS2Visible] = useState(false);
  useEffect(() => {
    if (!s2Ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setS2Visible(true); },
      { threshold: 0.2 }
    );
    obs.observe(s2Ref.current);
    return () => obs.disconnect();
  }, []);

  /* Scroll reveal for section 3 */
  const s3Ref = useRef<HTMLElement>(null);
  const [s3Visible, setS3Visible] = useState(false);
  useEffect(() => {
    if (!s3Ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setS3Visible(true); },
      { threshold: 0.2 }
    );
    obs.observe(s3Ref.current);
    return () => obs.disconnect();
  }, []);

  /* Scroll reveal for section 4 */
  const s4Ref = useRef<HTMLElement>(null);
  const [s4Visible, setS4Visible] = useState(false);
  useEffect(() => {
    if (!s4Ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setS4Visible(true); },
      { threshold: 0.2 }
    );
    obs.observe(s4Ref.current);
    return () => obs.disconnect();
  }, []);

  /* Scroll reveal for section 5 */
  const s5Ref = useRef<HTMLElement>(null);
  const [s5Visible, setS5Visible] = useState(false);
  useEffect(() => {
    if (!s5Ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setS5Visible(true); },
      { threshold: 0.15 }
    );
    obs.observe(s5Ref.current);
    return () => obs.disconnect();
  }, []);

  /* Iozera video player */
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
      setVideoPlaying(false);
    } else {
      videoRef.current.muted = false;
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };
  const handleVideoEnded = () => {
    setVideoPlaying(false);
  };

  return (
    <div className="landing-root">
      {/* ═══ NAVBAR (three-column: MENU | DOPS Pro | REQUEST DEMO) ═══ */}
      <nav className="landing-nav">
        <div className="nav-left" onClick={() => setMenuOpen((o) => !o)}>
          <div className="nav-hamburger">
            <span className={`ham-line ${menuOpen ? "ham-top-open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "ham-mid-open" : ""}`} />
            <span className={`ham-line ${menuOpen ? "ham-bot-open" : ""}`} />
          </div>
          <span className="nav-menu-label">Menu</span>
        </div>
        <div className="nav-center">
          <span
            className="nav-wordmark"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            DOPS Pro
          </span>
        </div>
        <div className="nav-right">
          <a href="#demo" className="nav-cta">Request Demo</a>
        </div>
      </nav>

      <div className={`nav-dropdown ${menuOpen ? "nav-dropdown-open" : ""}`}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item}
            className="nav-dropdown-link"
            href={`#${item.toLowerCase()}`}
            onClick={() => setMenuOpen(false)}
          >
            {item}
          </a>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
       * HERO
       * ═══════════════════════════════════════════════════════════ */}
      <section className="hero-section" data-theme="dark">
        <video className="hero-bg" autoPlay muted loop playsInline>
          <source src="https://github.com/chandanavinodhiran-hub/ifundos/releases/download/v1.0-assets/dops-hero.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-nav-overlay" />

        <div className="hero-content">
          {/* Eyebrow */}
          <p
            className="hero-eyebrow"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.3s",
            }}
          >
            Iozera Healthcare AI
          </p>

          {/* Headline line 1 */}
          <h1
            className="hero-headline"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.55s",
            }}
          >
            Dental Office
          </h1>

          {/* Headline line 2 */}
          <h1
            className="hero-headline hero-headline-2"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.7s",
            }}
          >
            Production System
          </h1>

          {/* Subheadline */}
          <p
            className="hero-sub"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.9s",
            }}
          >
            Minimise leaked revenue. Capture hidden revenue.
          </p>

          {/* Body */}
          <p
            className="hero-body"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "1.1s",
            }}
          >
            DOPS is an AI-powered dental production system that identifies
            unscheduled treatment, optimises clinical capacity, and automates
            patient communication — for dental practices, group practices,
            and DSOs.
          </p>

          {/* CTAs */}
          <div
            className="hero-ctas"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "1.3s",
            }}
          >
            <a href="#how" className="hero-btn">See How It Works</a>
            <a href="#demo" className="hero-btn hero-btn-primary">Request a Demo</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="scroll-indicator"
          style={{
            opacity: loaded ? 1 : 0,
            transitionDelay: "1.6s",
          }}
        >
          <span className="scroll-label">Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 2 — IOZERA
       * ═══════════════════════════════════════════════════════════ */}
      <section className="s2-section" ref={s2Ref}>
        <div className="s2-grid">
          <div className="s2-left">
            <p
              className="s2-eyebrow"
              style={{
                opacity: s2Visible ? 1 : 0,
                transform: s2Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.2s",
              }}
            >
              Our Parent Company
            </p>
            <h2
              className="s2-headline"
              style={{
                opacity: s2Visible ? 1 : 0,
                transform: s2Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.4s",
              }}
            >
              Built on Iozera.<br />
              Focused on dental.
            </h2>
            <p
              className="s2-body"
              style={{
                opacity: s2Visible ? 1 : 0,
                transform: s2Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.6s",
              }}
            >
              Iozera is an AI infrastructure company building unified, on-premise
              AI systems for healthcare. Dental is the primary focus. DOPS is
              Iozera&#39;s dental implementation, combining use case expertise,
              clinical knowledge, dental business intelligence, on-premise
              hardware, and data center connectivity into one system.
            </p>
          </div>
          <div className="s2-right">
            <div className="s2-video-wrap">
              <video
                ref={videoRef}
                className="s2-video"
                muted
                playsInline
                onEnded={handleVideoEnded}
              >
                <source src="https://github.com/chandanavinodhiran-hub/ifundos/releases/download/v1.0-assets/iozera.mp4" type="video/mp4" />
              </video>
              <div className="s2-play-btn" onClick={handleTogglePlay}>
                {videoPlaying ? (
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                    <rect x="0" y="0" width="6" height="24" fill="white" />
                    <rect x="14" y="0" width="6" height="24" fill="white" />
                  </svg>
                ) : (
                  <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                    <path d="M24 14L0 28V0L24 14Z" fill="white" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 3 — THE PROBLEM
       * ═══════════════════════════════════════════════════════════ */}
      <section className="s3-section" ref={s3Ref}>
        <img src="/s3-bg.png" alt="" className="s3-bg" />
        <div className="s3-overlay" />
        <div className="s3-inner">
          <h2
            className="s3-headline"
            style={{
              opacity: s3Visible ? 1 : 0,
              transform: s3Visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.2s",
            }}
          >
            The Problem With AI In Dental Today
          </h2>
          <p
            className="s3-subheadline"
            style={{
              opacity: s3Visible ? 1 : 0,
              transform: s3Visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.55s",
            }}
          >
            Every AI tool works alone. None of them work together.
          </p>

          <div className="s3-blocks">
            <div
              className="s3-block"
              style={{
                opacity: s3Visible ? 1 : 0,
                transform: s3Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.6s",
              }}
            >
              <p className="s3-label">Fragmented</p>
              <p className="s3-block-body">
                OpenAI, Claude, Overjet, Pearl. Each solves one problem in
                isolation. There is no unified system connecting AI visibility,
                patient communication, clinical intelligence, and scheduling
                into one production layer.
              </p>
            </div>
            <div
              className="s3-block"
              style={{
                opacity: s3Visible ? 1 : 0,
                transform: s3Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.75s",
              }}
            >
              <p className="s3-label">Non-Compliant</p>
              <p className="s3-block-body">
                Sending X-rays to a third-party cloud AI is not HIPAA compliant.
                Most dental AI platforms do exactly this. The industry has
                accepted a compliance risk it has not fully examined.
              </p>
            </div>
            <div
              className="s3-block"
              style={{
                opacity: s3Visible ? 1 : 0,
                transform: s3Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.9s",
              }}
            >
              <p className="s3-label">Disconnected From Revenue</p>
              <p className="s3-block-body">
                Existing tools generate insights. None of them close the loop to
                production. A finding in an X-ray AI does not automatically
                become a scheduled appointment. That gap is where revenue
                disappears.
              </p>
            </div>
          </div>

          <p
            className="s3-bottom"
            style={{
              opacity: s3Visible ? 1 : 0,
              transform: s3Visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "1.1s",
            }}
          >
            Iozera solves all three. In one system. On-premise.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 4 — THE PROBLEM IN DENTAL PRACTICES
       * ═══════════════════════════════════════════════════════════ */}
      <section className="s4-section" ref={s4Ref}>
        <img src="/s4-bg.png" alt="" className="s4-bg" />
        <div className="s4-overlay" />
        <div className="s4-inner">
          <p
            className="s4-eyebrow"
            style={{
              opacity: s4Visible ? 1 : 0,
              transform: s4Visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.2s",
            }}
          >
            The Problem
          </p>
          <h2
            className="s4-headline"
            style={{
              opacity: s4Visible ? 1 : 0,
              transform: s4Visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.4s",
            }}
          >
            The revenue is already there.<br />
            It&#39;s just not being collected.
          </h2>

          <div className="s4-cards">
            <div
              className="s4-card"
              style={{
                opacity: s4Visible ? 1 : 0,
                transform: s4Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.6s",
              }}
            >
              <p className="s4-label">01 — Leaked Revenue</p>
              <p className="s4-card-body">
                Traditional dental websites are now invisible. AI search
                platforms — ChatGPT, Perplexity, Google MUM — have replaced
                Google for patient discovery. Traditional search volume has
                dropped in 2025 and will continue to decline. Practices that
                have not rebuilt for AI visibility are losing new patients
                before the first click.
              </p>
            </div>
            <div
              className="s4-card"
              style={{
                opacity: s4Visible ? 1 : 0,
                transform: s4Visible ? "translateY(0)" : "translateY(30px)",
                transitionDelay: "0.75s",
              }}
            >
              <p className="s4-label">02 — Hidden Revenue</p>
              <p className="s4-card-body">
                The average dental practice has $80,000 to $150,000 in
                diagnosed, unscheduled treatment sitting dormant in their PMS.
                The clinical work is done. The revenue is never collected.
              </p>
            </div>
          </div>

          <p
            className="s4-bottom"
            style={{
              opacity: s4Visible ? 1 : 0,
              transform: s4Visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "0.9s",
            }}
          >
            Most booking systems fill empty chairs. Most recall systems remind
            by time. Neither is connected to production.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
       * SECTION 5 — THE SYSTEM
       * ═══════════════════════════════════════════════════════════ */}
      <section className="s5-section" ref={s5Ref}>
        <div className="s5-inner">
          <p className="s5-eyebrow" style={{ opacity: s5Visible ? 1 : 0, transform: s5Visible ? "translateY(0)" : "translateY(30px)", transitionDelay: "0.2s" }}>
            How DOPS Works
          </p>
          <h2 className="s5-headline" style={{ opacity: s5Visible ? 1 : 0, transform: s5Visible ? "translateY(0)" : "translateY(30px)", transitionDelay: "0.4s" }}>
            One system.<br />
            Diagnosis to dollars.
          </h2>

          <div className="s5-steps">
            {[
              { num: "01", title: "AI Visibility", body: "Practice is discoverable on ChatGPT, Perplexity, and Google MUM." },
              { num: "02", title: "Patient Conversion", body: "AI treatment coordinator answers questions, follows up on treatment plans, books appointments without front desk bandwidth." },
              { num: "03", title: "Clinical Intelligence", body: "X-ray AI identifies implant, ortho, perio, and cosmetic opportunities beyond caries. Matched to doctor skill level via SOC scoring." },
              { num: "04", title: "Capacity Scheduling", body: "Right patient. Right chair. Right time. Clinical capacity drives every scheduling decision." },
              { num: "05", title: "Production Activated", body: "Unscheduled treatment converts to booked, high-value appointments. Every front desk action generates a real-time revenue impact score." },
            ].map((step, i) => (
              <div
                key={step.num}
                className="s5-card"
                style={{
                  opacity: s5Visible ? 1 : 0,
                  transform: s5Visible ? "translateY(0)" : "translateY(30px)",
                  transitionDelay: `${0.6 + i * 0.1}s`,
                }}
              >
                <p className="s5-num">{step.num}</p>
                <p className="s5-title">{step.title}</p>
                <p className="s5-body">{step.body}</p>
              </div>
            ))}
          </div>

          <p className="s5-bottom" style={{ opacity: s5Visible ? 1 : 0, transform: s5Visible ? "translateY(0)" : "translateY(30px)", transitionDelay: "1.2s" }}>
            Each module standalone or as a complete bundle.
          </p>
        </div>
      </section>

      {/* ═══ STYLES ═══ */}
      <style>{`
        /* ── Root ── */
        .landing-root {
          background: ${C.bg};
          color: rgba(230, 232, 240, 0.9);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        html { scroll-behavior: smooth; }

        /* ── Navbar (three-column grid) ── */
        .landing-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: grid; grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 28px 48px;
          background: transparent;
          transition: background 0.4s ${C.easeContent}, backdrop-filter 0.4s ${C.easeContent};
          opacity: 0;
          animation: fadeIn 0.6s ${C.easeContent} 0.3s forwards;
        }
        .nav-left {
          justify-self: start;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
        }
        .nav-hamburger {
          display: flex; flex-direction: column; gap: 5px; width: 22px;
        }
        .ham-line {
          display: block; width: 100%; height: 1px;
          background: rgba(20, 20, 20, 0.8);
          transition: all 0.4s ${C.easeContent};
        }
        .nav-left:hover .ham-line { background: rgba(20, 20, 20, 0.95); }
        .ham-top-open { transform: rotate(45deg) translate(4px, 4px); }
        .ham-mid-open { opacity: 0; }
        .ham-bot-open { transform: rotate(-45deg) translate(4px, -4px); }
        .nav-menu-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400; letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(20, 20, 20, 0.8);
          transition: color 0.4s ${C.easeContent};
        }
        .nav-left:hover .nav-menu-label { color: rgba(20, 20, 20, 0.95); }
        .nav-center { justify-self: center; }
        .nav-wordmark {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 400; letter-spacing: 5px;
          text-transform: uppercase;
          color: rgba(20, 20, 20, 0.8);
          cursor: pointer;
          transition: color 0.4s ${C.easeContent};
        }
        .nav-wordmark:hover { color: rgba(20, 20, 20, 1); }
        .nav-right { justify-self: end; display: flex; align-items: center; }
        .nav-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 400; letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(20, 20, 20, 0.8);
          background: transparent; border: none;
          cursor: pointer; padding: 0;
          text-decoration: none; position: relative;
          transition: color 0.4s ${C.easeContent};
        }
        .nav-cta::after {
          content: ''; position: absolute; bottom: -4px; left: 50%;
          width: 0; height: 1px;
          background: rgba(20, 20, 20, 0.5);
          transition: width 0.4s ${C.easeContent}, left 0.4s ${C.easeContent};
        }
        .nav-cta:hover { color: rgba(20, 20, 20, 0.95); }
        .nav-cta:hover::after { width: 100%; left: 0; }

        /* ── Dropdown ── */
        .nav-dropdown {
          position: fixed; top: 80px; left: 48px;
          background: rgba(245, 242, 237, 0.96);
          backdrop-filter: blur(24px);
          padding: 0 40px; border-radius: 4px; z-index: 99;
          display: flex; flex-direction: column; gap: 0;
          max-height: 0; overflow: hidden; opacity: 0;
          transition: all 0.4s ${C.easeContent};
          border: 1px solid transparent;
        }
        .nav-dropdown-open {
          max-height: 280px; opacity: 1;
          padding: 28px 40px; gap: 24px;
          border-color: ${C.borderFaint};
        }
        .nav-dropdown-link {
          position: relative;
          color: rgba(20, 20, 20, 0.4);
          font-size: 13px; font-weight: 400; letter-spacing: 3px;
          text-transform: uppercase; text-decoration: none;
          cursor: pointer;
          transition: color 0.4s ${C.easeHover};
        }
        .nav-dropdown-link:hover { color: rgba(20, 20, 20, 0.8); }
        .nav-dropdown-link::after {
          content: ''; position: absolute; bottom: -4px; left: 50%;
          width: 0; height: 1px;
          background: rgba(20, 20, 20, 0.4);
          transition: width 0.4s ${C.easeHover}, left 0.4s ${C.easeHover};
        }
        .nav-dropdown-link:hover::after { width: 100%; left: 0; }

        /* ════════════════════════════════════════════════════════════
         * HERO
         * ════════════════════════════════════════════════════════════ */
        .hero-section {
          width: 100vw; height: 100vh;
          position: relative;
          overflow: hidden;
          margin: 0; padding: 0;
        }

        /* Background video */
        .hero-bg {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center center;
          background: #0A0E1A;
          will-change: transform;
          display: block;
          transform: scale(1.05);
        }
        @keyframes kenBurns {
          from { scale: 1; }
          to { scale: 1.05; }
        }

        /* Overlay gradient */
        .hero-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none; z-index: 2;
          background: linear-gradient(
            to right,
            rgba(245, 242, 237, 0.92) 0%,
            rgba(245, 242, 237, 0.85) 30%,
            rgba(245, 242, 237, 0.4) 60%,
            rgba(245, 242, 237, 0.0) 100%
          );
        }

        /* Nav protection overlay */
        .hero-nav-overlay {
          position: absolute; inset: 0;
          pointer-events: none; z-index: 3;
          background: linear-gradient(
            to bottom,
            rgba(245, 242, 237, 0.5) 0%,
            rgba(245, 242, 237, 0.0) 15%
          );
        }

        /* Content — bottom-left */
        .hero-content {
          position: absolute;
          bottom: 80px; left: 80px; right: 80px;
          z-index: 10;
        }

        /* Stagger transitions — all elements use same curve */
        .hero-eyebrow,
        .hero-headline,
        .hero-sub,
        .hero-body,
        .hero-ctas {
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }

        .hero-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(20, 20, 20, 0.55);
          margin: 0 0 24px 0;
        }

        .hero-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(40px, 4.5vw, 56px); font-weight: 600;
          width: 100%;
          letter-spacing: 2px;
          color: rgba(20, 20, 20, 0.92);
          line-height: 1.15;
          margin: 0;
        }
        .hero-headline-2 {
          margin-top: 4px;
          margin-bottom: 28px;
        }

        .hero-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 24px; font-weight: 600;
          letter-spacing: 1px;
          color: rgba(20, 20, 20, 0.75);
          margin: 0 0 24px 0;
        }

        .hero-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; font-weight: 500;
          line-height: 1.75;
          color: rgba(20, 20, 20, 0.65);
          margin: 0 0 40px 0;
          max-width: 520px;
        }

        /* CTAs */
        .hero-ctas {
          display: flex; gap: 24px;
        }
        .hero-btn {
          display: inline-block;
          background: transparent;
          border: 1px solid rgba(20, 20, 20, 0.35);
          padding: 14px 36px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(20, 20, 20, 0.7);
          text-decoration: none;
          cursor: pointer;
          transition: all 0.4s ${C.easeHover};
        }
        .hero-btn:hover {
          background: rgba(20, 20, 20, 0.05);
          border-color: rgba(20, 20, 20, 0.6);
          color: rgba(20, 20, 20, 0.95);
        }
        .hero-btn-primary {
          border-color: rgba(20, 20, 20, 0.6);
          color: rgba(20, 20, 20, 0.85);
        }

        /* ── Scroll indicator ── */
        .scroll-indicator {
          position: absolute; bottom: 40px; left: 50%;
          transform: translateX(-50%); z-index: 10;
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          transition: opacity 0.8s ${C.easeContent};
        }
        .scroll-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 9px; font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(20, 20, 20, 0.3);
        }
        .scroll-line {
          width: 1px; height: 48px;
          background: linear-gradient(to bottom, rgba(20, 20, 20, 0.4), rgba(20, 20, 20, 0));
          animation: scrollPulse 2.5s ease-in-out infinite;
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.15; transform: scaleY(0.7); }
          50% { opacity: 0.35; transform: scaleY(1.0); }
        }
        @keyframes fadeIn { to { opacity: 1; } }

        /* ════════════════════════════════════════════════════════════
         * SECTION 2 — IOZERA
         * ════════════════════════════════════════════════════════════ */
        .s2-section {
          width: 100%; height: 100vh;
          background: #F5F2ED;
          display: flex; align-items: center;
          padding: 0 80px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .s2-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          width: 100%;
          align-items: center;
        }
        .s2-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(20, 20, 20, 0.45);
          margin: 0 0 24px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s2-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(40px, 4.5vw, 56px); font-weight: 700;
          color: rgba(20, 20, 20, 0.92);
          line-height: 1.15;
          letter-spacing: 1px;
          margin: 0 0 28px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s2-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; font-weight: 500;
          line-height: 1.75;
          color: rgba(20, 20, 20, 0.65);
          margin: 0;
          max-width: 520px;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s2-statement {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; font-weight: 600;
          line-height: 1.75;
          color: rgba(20, 20, 20, 0.85);
          margin: 32px 0 0 0;
          max-width: 520px;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s2-right {
          display: flex; align-items: center; justify-content: center;
        }
        .s2-video-wrap {
          position: relative; width: 100%;
          border: 1px solid rgba(20, 20, 20, 0.1);
          border-radius: 4px;
          overflow: hidden;
          background: rgba(20, 20, 20, 0.06);
        }
        .s2-video {
          width: 100%; display: block;
          border-radius: 4px;
        }
        .s2-play-btn {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(20, 20, 20, 0.75);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.4s ${C.easeHover};
        }
        .s2-play-btn:hover {
          background: rgba(20, 20, 20, 0.9);
        }
        .s2-play-btn svg {
          margin-left: 4px;
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 3 — THE PROBLEM
         * ════════════════════════════════════════════════════════════ */
        .s3-section {
          width: 100%; min-height: 100vh;
          background: #0A0E1A;
          display: flex; align-items: center;
          padding: 80px;
          box-sizing: border-box;
          position: relative; overflow: hidden;
        }
        .s3-bg {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center center;
          display: block;
        }
        .s3-overlay {
          position: absolute; inset: 0;
          pointer-events: none; z-index: 1;
          background: rgba(245, 242, 237, 0.82);
        }
        .s3-inner { width: 100%; position: relative; z-index: 2; }
        .s3-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(20, 20, 20, 0.45);
          margin: 0 0 24px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s3-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(40px, 4.5vw, 56px); font-weight: 700;
          color: rgba(20, 20, 20, 0.92);
          line-height: 1.15;
          letter-spacing: 1px;
          margin: 0 0 24px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s3-subheadline {
          font-family: 'DM Sans', sans-serif;
          font-size: 22px; font-weight: 500;
          color: rgba(20, 20, 20, 0.70);
          line-height: 1.5;
          margin: 0 0 64px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s3-blocks {
          display: flex; gap: 24px;
          width: 100%;
        }
        .s3-block {
          flex: 1;
          padding: 40px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 4px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent}, background 0.4s ${C.easeContent}, border-color 0.4s ${C.easeContent}, box-shadow 0.4s ${C.easeContent};
        }
        .s3-block:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(20, 20, 20, 0.15);
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(20, 20, 20, 0.08);
        }
        .s3-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: rgba(20, 20, 20, 0.45);
          margin: 0 0 16px 0;
        }
        .s3-block-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; font-weight: 500;
          line-height: 1.75;
          color: rgba(20, 20, 20, 0.65);
          margin: 0;
        }
        .s3-bottom {
          font-family: 'DM Sans', sans-serif;
          font-size: 20px; font-weight: 600;
          color: rgba(20, 20, 20, 0.85);
          margin: 64px 0 0 0;
          text-align: center;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 4 — THE PROBLEM IN DENTAL PRACTICES
         * ════════════════════════════════════════════════════════════ */
        .s4-section {
          width: 100%; min-height: 100vh;
          background: #0A0E1A;
          display: flex; align-items: center;
          padding: 80px;
          box-sizing: border-box;
          position: relative; overflow: hidden;
        }
        .s4-bg {
          position: absolute; top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center center;
          display: block;
        }
        .s4-overlay {
          position: absolute; inset: 0;
          pointer-events: none; z-index: 1;
          background: rgba(245, 242, 237, 0.82);
        }
        .s4-inner { width: 100%; position: relative; z-index: 2; }
        .s4-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(20, 20, 20, 0.45);
          margin: 0 0 24px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s4-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(40px, 4.5vw, 56px); font-weight: 700;
          color: rgba(20, 20, 20, 0.92);
          line-height: 1.1;
          letter-spacing: 1px;
          margin: 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s4-cards {
          display: flex; gap: 24px;
          width: 100%;
          margin-top: 64px;
        }
        .s4-card {
          flex: 1;
          padding: 40px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 4px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent}, background 0.4s ${C.easeContent}, border-color 0.4s ${C.easeContent}, box-shadow 0.4s ${C.easeContent};
        }
        .s4-card:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(20, 20, 20, 0.15);
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(20, 20, 20, 0.08);
        }
        .s4-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: rgba(20, 20, 20, 0.45);
          margin: 0 0 16px 0;
        }
        .s4-card-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; font-weight: 500;
          line-height: 1.75;
          color: rgba(20, 20, 20, 0.65);
          margin: 0;
        }
        .s4-bottom {
          font-family: 'DM Sans', sans-serif;
          font-size: 20px; font-weight: 600;
          color: rgba(20, 20, 20, 0.85);
          margin: 64px 0 0 0;
          text-align: center;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }

        /* ════════════════════════════════════════════════════════════
         * SECTION 5 — THE SYSTEM
         * ════════════════════════════════════════════════════════════ */
        .s5-section {
          width: 100%; min-height: 100vh;
          background: #EDEAE4;
          display: flex; align-items: center;
          padding: 80px;
          box-sizing: border-box;
        }
        .s5-inner { width: 100%; }
        .s5-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: rgba(20, 20, 20, 0.45);
          margin: 0 0 24px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s5-headline {
          font-family: 'DM Sans', sans-serif;
          font-size: clamp(40px, 4.5vw, 56px); font-weight: 700;
          color: rgba(20, 20, 20, 0.92);
          line-height: 1.1;
          letter-spacing: 1px;
          margin: 0 0 16px 0;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }
        .s5-steps {
          display: flex; gap: 2px;
          width: 100%;
          margin-top: 64px;
        }
        .s5-card {
          flex: 1;
          padding: 36px 32px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(20, 20, 20, 0.08);
          border-radius: 4px;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent}, background 0.4s ${C.easeContent}, border-color 0.4s ${C.easeContent}, box-shadow 0.4s ${C.easeContent};
        }
        .s5-card:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(20, 20, 20, 0.15);
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(20, 20, 20, 0.08);
        }
        .s5-num {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: rgba(20, 20, 20, 0.35);
          margin: 0 0 20px 0;
        }
        .s5-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px; font-weight: 700;
          color: rgba(20, 20, 20, 0.92);
          margin: 0 0 12px 0;
        }
        .s5-body {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px; font-weight: 500;
          line-height: 1.7;
          color: rgba(20, 20, 20, 0.65);
          margin: 0;
        }
        .s5-bottom {
          font-family: 'DM Sans', sans-serif;
          font-size: 17px; font-weight: 600;
          color: rgba(20, 20, 20, 0.85);
          margin: 48px 0 0 0;
          text-align: center;
          transition: opacity 0.8s ${C.easeContent}, transform 0.8s ${C.easeContent};
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .landing-nav { padding: 16px 24px; }
          .nav-menu-label { display: none; }
          .nav-cta { display: none; }
          .nav-wordmark { font-size: 13px; letter-spacing: 4px; }
          .nav-dropdown { left: 24px; top: 64px; }
          .hero-content { left: 32px; right: 32px; bottom: 80px; }
          .hero-headline { font-size: clamp(28px, 7vw, 40px); }
          .hero-sub { font-size: 15px; }
          .hero-ctas { flex-direction: column; gap: 16px; }
          .hero-btn { text-align: center; }
          .scroll-indicator { display: none; }
          .s2-section { padding: 60px 32px; height: auto; min-height: 100vh; }
          .s2-grid { grid-template-columns: 1fr; gap: 40px; }
          .s2-headline { font-size: clamp(28px, 7vw, 40px); }
          .s3-section { padding: 60px 32px; }
          .s3-headline { font-size: clamp(28px, 7vw, 40px); margin-bottom: 40px; }
          .s3-blocks { flex-direction: column; gap: 32px; }
          .s3-block { padding: 0; }
          .s3-bottom { font-size: 17px; }
          .s4-section { padding: 60px 32px; }
          .s4-headline { font-size: clamp(28px, 7vw, 40px); }
          .s4-cards { flex-direction: column; }
          .s4-bottom { font-size: 17px; }
          .s5-section { padding: 60px 32px; }
          .s5-headline { font-size: clamp(28px, 7vw, 40px); }
          .s5-steps { flex-direction: column; gap: 16px; }
          .s5-bottom { font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
