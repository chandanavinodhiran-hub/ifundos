"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Send, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigator } from "./navigator-context";
import { findScriptedResponse, getPageName } from "./navigator-responses";

export function NavigatorChat() {
  const { mode, setMode, chatMessages, addMessage, clearMessages, isThinking, setIsThinking } =
    useNavigator();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const role = session?.user?.role ?? "FUND_MANAGER";
  const pageName = getPageName(role, pathname);
  const isOpen = mode === "chat";

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isThinking]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      addMessage(
        "navigator",
        `Hello! I'm Navigator, your AI advisor for iFundOS. I can see you're on the **${pageName}** page. How can I help you today?`
      );
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isThinking) return;

    setInput("");
    addMessage("user", trimmed);
    setIsThinking(true);

    // Try API first, fall back to scripted
    try {
      const res = await fetch("/api/navigator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, role, pathname }),
      });

      if (res.ok) {
        const data = await res.json();
        addMessage("navigator", data.response);
      } else {
        // Fallback to scripted
        const scripted = findScriptedResponse(role, pathname, trimmed);
        addMessage("navigator", scripted ?? "I'm having trouble connecting. Please try again.");
      }
    } catch {
      const scripted = findScriptedResponse(role, pathname, trimmed);
      addMessage("navigator", scripted ?? "I'm having trouble connecting. Please try again.");
    } finally {
      setIsThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMode("closed")}
        />
      )}

      {/* Chat panel */}
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-slate-900 shadow-2xl shadow-black/40 transition-transform duration-300 ease-out",
          // Desktop: right slide-out panel
          "md:top-0 md:right-0 md:w-[420px] md:h-full md:border-l md:border-slate-700/50",
          // Mobile: full screen slide up from bottom
          "top-0 left-0 right-0 bottom-0 md:left-auto",
          isOpen
            ? "translate-x-0 md:translate-x-0 translate-y-0"
            : "translate-x-full md:translate-x-full translate-y-full md:translate-y-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Navigator</h2>
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Viewing: {pageName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode("closed")}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 animate-fade-in-up",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "navigator" && (
                <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-400 font-mono">N</span>
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-violet-900/60 text-violet-100 rounded-br-md"
                    : "bg-slate-800 text-slate-200 rounded-bl-md"
                )}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="flex gap-3 animate-fade-in-up">
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-violet-400 font-mono">N</span>
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-4 border-t border-slate-700/50 shrink-0">
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-violet-500/40 transition-shadow">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Navigator anything..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none font-sans"
              disabled={isThinking}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                input.trim() && !isThinking
                  ? "bg-violet-600 text-white hover:bg-violet-500"
                  : "text-slate-600"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-2 text-center font-mono">
            Navigator AI Advisor &middot; Context-aware assistance
          </p>
        </div>
      </div>
    </>
  );
}

/** Simple markdown-like formatting for bold text */
function formatMessage(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
