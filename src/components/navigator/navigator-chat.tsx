"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Send, Trash2 } from "lucide-react";
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
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
          style={{ zIndex: 499 }}
          onClick={() => setMode("closed")}
        />
      )}

      <div
        className={cn(
          "fixed flex flex-col transition-transform duration-300 ease-out",
          /* Desktop: side panel */
          "md:top-0 md:right-0 md:w-[420px] md:h-full md:border-l md:border-sovereign-ink md:bg-sovereign-charcoal md:shadow-2xl md:shadow-black/40",
          /* Mobile: full-screen dark charcoal */
          "top-0 left-0 right-0 bottom-0 md:left-auto",
          isOpen
            ? "translate-x-0 md:translate-x-0 translate-y-0"
            : "translate-x-full md:translate-x-full translate-y-full md:translate-y-0"
        )}
        style={{ background: "#1a1714", zIndex: 500 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{
            borderBottom: "1px solid rgba(245,240,227,0.08)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Navigator orb — charcoal sphere with gold center */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "#2a2520",
                boxShadow: "4px 4px 10px rgba(0,0,0,0.4), -4px -4px 10px rgba(60,55,48,0.3)",
              }}
            >
              <div
                className="w-3 h-3 rounded-full animate-orb-pulse"
                style={{
                  background: "radial-gradient(circle at 35% 35%, #d4b665, #b8943f)",
                  boxShadow: "0 0 10px rgba(184,148,63,0.35)",
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold" style={{ color: "#f5f0e3" }}>Navigator</h2>
                <span className="w-2 h-2 rounded-full bg-sovereign-gold animate-pulse" />
              </div>
              <p className="text-xs font-mono" style={{ color: "#9a9488" }}>
                Viewing: {pageName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearMessages}
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{ color: "#9a9488" }}
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode("closed")}
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{ color: "#9a9488" }}
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
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: "#2a2520",
                    boxShadow: "2px 2px 6px rgba(0,0,0,0.3), -2px -2px 6px rgba(60,55,48,0.2)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: "radial-gradient(circle at 35% 35%, #d4b665, #b8943f)",
                    }}
                  />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user"
                    ? "rounded-br-md"
                    : "rounded-bl-md"
                )}
                style={
                  msg.role === "user"
                    ? {
                        background: "rgba(184,148,63,0.12)",
                        color: "#d4b665",
                        border: "1px solid rgba(184,148,63,0.2)",
                      }
                    : {
                        background: "#252119",
                        color: "#c8c0b0",
                      }
                }
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3 animate-fade-in-up">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: "#2a2520",
                  boxShadow: "2px 2px 6px rgba(0,0,0,0.3), -2px -2px 6px rgba(60,55,48,0.2)",
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #d4b665, #b8943f)",
                  }}
                />
              </div>
              <div
                className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5"
                style={{ background: "#252119" }}
              >
                <span className="w-2 h-2 rounded-full bg-sovereign-gold animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-sovereign-gold animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-sovereign-gold animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: "1px solid rgba(245,240,227,0.08)" }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2 transition-shadow"
            style={{
              background: "#252119",
              boxShadow: "inset 3px 3px 8px rgba(0,0,0,0.4), inset -3px -3px 8px rgba(60,55,48,0.15)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Navigator anything..."
              className="flex-1 bg-transparent text-sm outline-none font-sans"
              style={{ color: "#f5f0e3", }}
              disabled={isThinking}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className={cn(
                "p-2 rounded-lg transition-all cursor-pointer",
                input.trim() && !isThinking
                  ? "text-sovereign-charcoal"
                  : ""
              )}
              style={
                input.trim() && !isThinking
                  ? {
                      background: "linear-gradient(135deg, #d4b665, #b8943f)",
                      boxShadow: "3px 3px 8px rgba(0,0,0,0.3), -2px -2px 6px rgba(60,55,48,0.2)",
                    }
                  : { color: "#9a9488" }
              }
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] mt-2 text-center font-mono" style={{ color: "#7a7265" }}>
            Navigator AI Advisor &middot; Context-aware assistance
          </p>
        </div>
      </div>
    </>
  );
}

function formatMessage(content: string) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold" style={{ color: "#f5f0e3" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
