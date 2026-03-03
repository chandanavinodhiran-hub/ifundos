"use client";

import { useEffect, useRef } from "react";

export default function CursorLight() {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && lightRef.current) {
      lightRef.current.style.display = "none";
      return;
    }

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (lightRef.current) {
          lightRef.current.style.transform = `translate(${e.clientX - 400}px, ${e.clientY - 400}px)`;
        }
      });
    };
    const handleEnter = () => {
      if (lightRef.current) lightRef.current.style.opacity = "1";
    };
    const handleLeave = () => {
      if (lightRef.current) lightRef.current.style.opacity = "0";
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseenter", handleEnter);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseenter", handleEnter);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={lightRef}
      className="cursor-light"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        width: "800px",
        height: "800px",
        borderRadius: "50%",
        background:
          "radial-gradient(circle at center, rgba(92,111,181,0.18) 0%, rgba(92,111,181,0.10) 25%, rgba(92,111,181,0.04) 45%, transparent 65%)",
        transition: "opacity 0.4s ease",
        opacity: 0,
        willChange: "transform",
      }}
    />
  );
}
