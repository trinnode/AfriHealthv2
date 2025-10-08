/**
 * Progress Bar Component
 * Shows upload/download progress
 */

import React from "react";

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "yellow" | "red";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  size = "md",
  color = "blue",
  className = "",
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heightClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-900">
              {clampedProgress.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[size]}`}
      >
        <div
          className={`${colorClasses[color]} ${heightClasses[size]} transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
