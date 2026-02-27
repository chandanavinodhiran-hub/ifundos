"use client";

import { useEffect, useState, useRef } from "react";
import { Sparkles, MessageSquare, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "./navigator-context";

export function NavigatorButton() {
  const { mode, setMode, popoverOpen, setPopoverOpen } = useNavigator();
  const [showLabel, setShowLabel] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
        buttonRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen, setPopoverOpen]);

  const isActive = mode !== "closed";

  function handleButtonClick() {
    if (isActive) {
      setMode("closed");
    } else {
      setPopoverOpen(!popoverOpen);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Mode selector popover */}
      {popoverOpen && !isActive && (
        <div
          ref={popoverRef}
          className="mb-2 w-56 bg-slate-900 rounded-2xl shadow-2xl shadow-black/30 border border-slate-700/50 overflow-hidden animate-fade-in-up"
        >
          <div className="px-4 py-3 border-b border-slate-700/50">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Navigator
            </p>
          </div>
          <div className="p-2">
            <button
              onClick={() => setMode("chat")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                <MessageSquare className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-sm">Chat with Navigator</p>
                <p className="text-xs text-slate-500">Ask anything about this page</p>
              </div>
            </button>
            <button
              onClick={() => setMode("avatar")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                <Eye className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-sm">Launch Avatar</p>
                <p className="text-xs text-slate-500">Visual AI assistant</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* First-visit label */}
      {showLabel && (
        <span
          className={cn(
            "mr-1 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-lg transition-opacity duration-500 whitespace-nowrap",
            labelVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <Sparkles className="w-3 h-3 inline mr-1.5 text-violet-400" />
          Navigator
        </span>
      )}

      {/* Floating action button — 56px (48px on mobile) */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={cn(
          "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer",
          isActive
            ? "bg-slate-800 text-white shadow-slate-500/20 hover:bg-slate-700"
            : "bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-violet-500/30 animate-breathing hover:shadow-violet-500/40"
        )}
        aria-label={isActive ? "Close Navigator" : "Open Navigator"}
      >
        {isActive ? (
          <X className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
