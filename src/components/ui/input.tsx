import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border-0 bg-[#E0E3EB] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-[inset_4px_4px_10px_rgba(155,161,180,0.3),inset_-4px_-4px_10px_rgba(255,255,255,0.5)] focus-visible:shadow-[inset_4px_4px_10px_rgba(155,161,180,0.35),inset_-4px_-4px_10px_rgba(255,255,255,0.55),0_0_0_2px_rgba(92,111,181,0.2)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
