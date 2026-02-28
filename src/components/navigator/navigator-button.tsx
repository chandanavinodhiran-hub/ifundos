"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, MessageSquare, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "./navigator-context";

export function NavigatorButton() {
  const { mode, setMode, popoverOpen, setPopoverOpen } = useNavigator();
  const { data: session } = useSession();
  const [showLabel, setShowLabel] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const role = session?.user?.role ?? "FUND_MANAGER";
  const isFundManager = role === "FUND_MANAGER";

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
    <div
      className={cn(
        "fixed bottom-6 right-6 flex flex-col items-end gap-2",
        /* On mobile, hide for Fund Manager role (tab bar has Navigator) */
        isFundManager && "hidden md:flex"
      )}
      style={{ zIndex: 400 }}
    >
      {/* Mode selector popover */}
      {popoverOpen && !isActive && (
        <div
          ref={popoverRef}
          className="mb-2 w-56 bg-neu-base md:bg-sovereign-charcoal rounded-[18px] shadow-neu-raised-lg md:shadow-2xl md:shadow-black/30 border-0 md:border md:border-sovereign-ink overflow-hidden animate-fade-in-up"
        >
          <div className="px-4 py-3 border-b border-neu-dark/60 md:border-sovereign-ink">
            <p className="text-xs font-semibold text-sovereign-stone uppercase tracking-wider">
              Navigator
            </p>
          </div>
          <div className="p-2">
            <button
              onClick={() => setMode("chat")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-sovereign-charcoal md:text-sovereign-warm hover:bg-neu-dark md:hover:bg-sovereign-ink transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-sovereign-gold/15 shadow-neu-inset md:shadow-none flex items-center justify-center group-hover:bg-sovereign-gold/25 transition-colors">
                <MessageSquare className="w-4 h-4 text-sovereign-gold" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sovereign-charcoal md:text-sovereign-ivory text-sm">Chat with Navigator</p>
                <p className="text-xs text-sovereign-stone">Ask anything about this page</p>
              </div>
            </button>
            <button
              onClick={() => setMode("avatar")}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-sovereign-charcoal md:text-sovereign-warm hover:bg-neu-dark md:hover:bg-sovereign-ink transition-colors cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-sovereign-gold/15 shadow-neu-inset md:shadow-none flex items-center justify-center group-hover:bg-sovereign-gold/25 transition-colors">
                <Eye className="w-4 h-4 text-sovereign-gold" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sovereign-charcoal md:text-sovereign-ivory text-sm">Launch Avatar</p>
                <p className="text-xs text-sovereign-stone">Visual AI assistant</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* First-visit label */}
      {showLabel && (
        <span
          className={cn(
            "mr-1 px-3 py-1.5 rounded-full bg-neu-base md:bg-sovereign-charcoal text-sovereign-charcoal md:text-sovereign-ivory text-xs font-medium shadow-neu-raised-sm md:shadow-lg transition-opacity duration-500 whitespace-nowrap",
            labelVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <Sparkles className="w-3 h-3 inline mr-1.5 text-sovereign-gold" />
          Navigator
        </span>
      )}

      {/* Floating action button */}
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={cn(
          "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer",
          isActive
            ? "bg-sovereign-ink text-sovereign-ivory shadow-sovereign-charcoal/20 hover:bg-sovereign-charcoal"
            : "bg-sovereign-gold text-sovereign-charcoal shadow-glow animate-breathing hover:shadow-[0_0_32px_rgba(184,148,63,0.25)]"
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
