"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "./navigator-context";
import { findScriptedResponse, getPageName } from "./navigator-responses";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

export function NavigatorAvatar() {
  const { mode, setMode } = useNavigator();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const role = session?.user?.role ?? "FUND_MANAGER";
  const pageName = getPageName(role, pathname);
  const isOpen = mode === "avatar";

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setOrbState("idle");
      setResponse("");
      setDisplayedResponse("");
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen]);

  // Typewriter effect for response
  useEffect(() => {
    if (!response) {
      setDisplayedResponse("");
      return;
    }

    setOrbState("speaking");
    setDisplayedResponse("");
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      setDisplayedResponse(response.slice(0, idx));
      if (idx >= response.length) {
        clearInterval(interval);
        setTimeout(() => setOrbState("idle"), 500);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [response]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || orbState === "thinking") return;

    setInput("");
    setResponse("");
    setDisplayedResponse("");
    setOrbState("listening");

    // Brief listening state
    await new Promise((r) => setTimeout(r, 600));
    setOrbState("thinking");

    try {
      const res = await fetch("/api/navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, role, pathname }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.response);
      } else {
        const scripted = findScriptedResponse(role, pathname, trimmed);
        setResponse(scripted ?? "I'm having trouble processing that. Please try again.");
      }
    } catch {
      const scripted = findScriptedResponse(role, pathname, trimmed);
      setResponse(scripted ?? "I'm having trouble processing that. Please try again.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => setMode("closed")}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[600px] mx-4 md:mx-0 bg-slate-900 rounded-3xl shadow-2xl shadow-black/50 border border-slate-700/50 overflow-hidden animate-fade-in-up flex flex-col"
        style={{ maxHeight: "min(500px, 85vh)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Navigator Avatar</h2>
            <span className="text-xs text-slate-500 font-mono">&middot; {pageName}</span>
          </div>
          <button
            onClick={() => setMode("closed")}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Orb area */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 overflow-y-auto">
          {/* Animated Orb */}
          <div className="relative w-[120px] h-[120px] mb-6">
            {/* Outer rotating ring */}
            <div
              className={cn(
                "absolute inset-[-12px] rounded-full border border-violet-500/20 transition-all duration-700",
                orbState === "thinking" && "animate-spin border-violet-400/40",
                orbState === "speaking" && "border-violet-400/30",
                orbState === "listening" && "border-violet-400/50 scale-110"
              )}
              style={{ animationDuration: "3s" }}
            />
            {/* Middle rotating ring (counter) */}
            <div
              className={cn(
                "absolute inset-[-6px] rounded-full border border-violet-400/15 transition-all duration-700",
                orbState === "thinking" && "animate-spin border-violet-400/30",
                orbState === "listening" && "border-violet-400/40 scale-105"
              )}
              style={{ animationDuration: "2s", animationDirection: "reverse" }}
            />
            {/* Core orb */}
            <div
              className={cn(
                "w-[120px] h-[120px] rounded-full bg-gradient-to-br from-violet-500 via-violet-600 to-indigo-700 transition-all duration-500",
                orbState === "idle" && "animate-orb-idle shadow-[0_0_40px_rgba(124,58,237,0.3)]",
                orbState === "listening" && "animate-orb-listen shadow-[0_0_60px_rgba(124,58,237,0.5)] scale-110",
                orbState === "thinking" && "animate-orb-think shadow-[0_0_50px_rgba(124,58,237,0.4)]",
                orbState === "speaking" && "animate-orb-speak shadow-[0_0_50px_rgba(124,58,237,0.4)]"
              )}
            />
            {/* Inner glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
          </div>

          {/* State label */}
          <p className="text-xs text-slate-500 font-mono mb-4 uppercase tracking-wider">
            {orbState === "idle" && "Ready"}
            {orbState === "listening" && "Listening..."}
            {orbState === "thinking" && "Thinking..."}
            {orbState === "speaking" && "Speaking..."}
          </p>

          {/* Response text */}
          {displayedResponse && (
            <div className="w-full max-h-[140px] overflow-y-auto bg-slate-800/50 rounded-xl px-5 py-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {displayedResponse}
              {displayedResponse.length < (response?.length ?? 0) && (
                <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-text-bottom" />
              )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-5 py-4 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-violet-500/40 transition-shadow">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Navigator..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none font-sans"
              disabled={orbState === "thinking"}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || orbState === "thinking"}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                input.trim() && orbState !== "thinking"
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "text-slate-600"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
