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
        "relative inline-flex rounded-2xl bg-neu-dark shadow-neu-inset p-1",
        className
      )}
    >
      {/* Sliding active pill */}
      <div
        className="absolute top-1 bottom-1 rounded-xl bg-neu-light shadow-neu-raised-sm transition-transform duration-300 ease-out"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
          left: "2px",
        }}
      />

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer",
            "flex-1 select-none",
            option.value === value
              ? "text-sovereign-charcoal"
              : "text-sovereign-stone hover:text-sovereign-charcoal/70"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                "text-xs font-mono tabular-nums",
                option.value === value ? "text-sovereign-gold" : "text-sovereign-stone"
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
