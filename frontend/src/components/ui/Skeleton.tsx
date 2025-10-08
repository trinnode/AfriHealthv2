/**
 * Skeleton Loader Components
 * Loading placeholders for various UI elements
 */

import type { ReactElement } from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps): ReactElement => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ animationDuration: "1.5s" }}
    />
  );
};

export const SkeletonText = ({
  lines = 3,
}: {
  lines?: number;
}): ReactElement => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = (): ReactElement => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <SkeletonText lines={2} />
    </div>
  );
};

export const SkeletonTable = ({
  rows = 5,
}: {
  rows?: number;
}): ReactElement => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonStats = (): ReactElement => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32" />
        </div>
      ))}
    </div>
  );
};
