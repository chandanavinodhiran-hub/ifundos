"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type NavigatorMode = "closed" | "chat" | "avatar" | "bottom-sheet";

export interface ChatMessage {
  id: string;
  role: "user" | "navigator";
  content: string;
  timestamp: Date;
}

interface NavigatorContextType {
  mode: NavigatorMode;
  setMode: (mode: NavigatorMode) => void;
  popoverOpen: boolean;
  setPopoverOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  addMessage: (role: "user" | "navigator", content: string) => void;
  clearMessages: () => void;
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
}

const NavigatorContext = createContext<NavigatorContextType | null>(null);

export function NavigatorProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<NavigatorMode>("closed");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const setMode = useCallback((newMode: NavigatorMode) => {
    setModeState(newMode);
    setPopoverOpen(false);
  }, []);

  const addMessage = useCallback((role: "user" | "navigator", content: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  return (
    <NavigatorContext.Provider
      value={{
        mode,
        setMode,
        popoverOpen,
        setPopoverOpen,
        chatMessages,
        addMessage,
        clearMessages,
        isThinking,
        setIsThinking,
      }}
    >
      {children}
    </NavigatorContext.Provider>
  );
}

export function useNavigator() {
  const ctx = useContext(NavigatorContext);
  if (!ctx) throw new Error("useNavigator must be used within NavigatorProvider");
  return ctx;
}
