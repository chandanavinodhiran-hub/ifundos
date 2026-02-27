"use client";

import { useEffect, useState, useRef } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
  cursor?: boolean;
}

export function Typewriter({
  text,
  speed = 30,
  delay = 0,
  className = "",
  onComplete,
  cursor = true,
}: TypewriterProps) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    idx.current = 0;
    setDisplayed("");
    setDone(false);

    const interval = setInterval(() => {
      idx.current++;
      if (idx.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayed(text.slice(0, idx.current));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, started, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {cursor && !done && (
        <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

/* Terminal-style typewriter for AI screening stages */
interface TerminalLineProps {
  lines: { text: string; type?: "command" | "output" | "success" | "warning" | "info" }[];
  speed?: number;
  lineDelay?: number;
  className?: string;
  onComplete?: () => void;
}

export function TerminalBlock({
  lines,
  speed = 20,
  lineDelay = 400,
  className = "",
  onComplete,
}: TerminalLineProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (visibleLines >= lines.length) {
      setAllDone(true);
      onComplete?.();
      return;
    }

    const line = lines[visibleLines];
    let charIdx = 0;
    setCurrentText("");

    const typeInterval = setInterval(() => {
      charIdx++;
      if (charIdx >= line.text.length) {
        setCurrentText(line.text);
        clearInterval(typeInterval);
        setTimeout(() => {
          setVisibleLines((v) => v + 1);
        }, lineDelay);
      } else {
        setCurrentText(line.text.slice(0, charIdx));
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [visibleLines, lines, speed, lineDelay, onComplete]);

  const lineColors: Record<string, string> = {
    command: "text-leaf-400",
    output: "text-gray-300",
    success: "text-green-400",
    warning: "text-amber-400",
    info: "text-ocean-400",
  };

  return (
    <div className={`font-mono text-sm space-y-1 ${className}`}>
      {lines.slice(0, visibleLines).map((line, i) => (
        <div key={i} className={lineColors[line.type || "output"]}>
          {line.type === "command" && <span className="text-leaf-500 mr-2">$</span>}
          {line.text}
        </div>
      ))}
      {!allDone && visibleLines < lines.length && (
        <div className={lineColors[lines[visibleLines]?.type || "output"]}>
          {lines[visibleLines]?.type === "command" && (
            <span className="text-leaf-500 mr-2">$</span>
          )}
          {currentText}
          <span className="inline-block w-[6px] h-[14px] bg-leaf-400 ml-0.5 animate-pulse" />
        </div>
      )}
    </div>
  );
}
