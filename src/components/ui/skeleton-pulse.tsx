"use client";

export function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-leaf-100/60 ${className}`}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-2xl border border-leaf-100 bg-white shadow-soft p-6 space-y-3">
      <SkeletonPulse className="h-4 w-24" />
      <SkeletonPulse className="h-8 w-20" />
      <SkeletonPulse className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonPulse key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
