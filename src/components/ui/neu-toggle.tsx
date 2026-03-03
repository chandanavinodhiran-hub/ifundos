"use client";

import { cn } from "@/lib/utils";

interface NeuToggleOption {
  label: string;
  value: string;
  count?: number;
}

interface NeuToggleProps {
  options: NeuToggleOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function NeuToggle({ options, value, onChange, className }: NeuToggleProps) {
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div
      className={cn(
        "relative inline-flex p-1.5",
        className
      )}
      style={{
        borderRadius: 14,
        background: "rgba(228, 231, 238, 0.5)",
        boxShadow: "inset 3px 3px 8px rgba(155, 161, 180, 0.2), inset -3px -3px 8px rgba(255, 255, 255, 0.6)",
      }}
    >
      {/* Sliding active pill — raised inside the inset container */}
      <div
        className="absolute top-1.5 bottom-1.5 transition-transform duration-300 ease-out"
        style={{
          width: `calc(${100 / options.length}% - 6px)`,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 6}px))`,
          left: "3px",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(30, 34, 53, 0.08), 0 1px 3px rgba(30, 34, 53, 0.06)",
          border: "1px solid rgba(255,255,255,0.8)",
          borderRadius: 12,
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer",
            "flex-1 select-none",
          )}
          style={{ color: option.value === value ? "var(--text-primary)" : "var(--text-muted)" }}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className="text-xs font-mono tabular-nums"
              style={{ color: option.value === value ? "var(--accent)" : "var(--text-muted)" }}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
