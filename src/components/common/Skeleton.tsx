interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

import React from "react";

export function Skeleton({ className = "", style }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} style={style} />;
}

export function SkeletonKPICard() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-5 w-10 rounded-full" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-hover p-5">
      <div className="flex gap-4">
        <Skeleton className="w-14 h-16 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-14 rounded-xl" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonBarChart() {
  return (
    <div className="flex items-end gap-3 h-40 pt-4">
      {[70, 50, 85, 65, 100].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton className="w-full rounded-t-xl" style={{ height: `${h}%` }} />
          <Skeleton className="h-3 w-8" />
        </div>
      ))}
    </div>
  );
}
