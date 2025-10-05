import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Button component props
 */
interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Animated Button Component
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "font-mono font-bold rounded-lg transition-all transform";

  const variantClasses = {
    primary: "bg-afrihealth-orange text-white hover:bg-opacity-90",
    secondary:
      "bg-transparent border-2 border-afrihealth-green text-afrihealth-green hover:bg-afrihealth-green hover:text-white",
    danger: "bg-afrihealth-red text-white hover:bg-opacity-90",
    success: "bg-afrihealth-green text-white hover:bg-opacity-90",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105";

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

/**
 * Card component props
 */
interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: "default" | "orange" | "green" | "red";
}

/**
 * Card Component
 */
export function Card({
  children,
  title,
  className = "",
  variant = "default",
}: CardProps) {
  const variantClasses = {
    default: "border-gray-700",
    orange: "border-afrihealth-orange",
    green: "border-afrihealth-green",
    red: "border-afrihealth-red",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 20px 60px rgba(255, 107, 53, 0.2)" }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br from-gray-900 via-black to-gray-900 backdrop-blur-sm border-2 ${variantClasses[variant]} rounded-2xl p-8 shadow-xl ${className}`}
    >
      {title && (
        <h3 className="font-lora text-3xl font-bold text-white mb-6">
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
}

/**
 * Input component props
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input Component
 */
export function Input({
  label,
  error,
  helperText,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block font-mono text-sm font-bold text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 bg-black bg-opacity-50 border-2 ${
          error ? "border-afrihealth-red" : "border-gray-700"
        } rounded-lg text-white font-mono focus:outline-none focus:border-afrihealth-orange transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm font-mono text-afrihealth-red">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm font-mono text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * Badge component props
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info";
}

/**
 * Badge Component
 */
export function Badge({ children, variant = "info" }: BadgeProps) {
  const variantClasses = {
    success: "bg-afrihealth-green text-white",
    warning: "bg-afrihealth-orange text-white",
    danger: "bg-afrihealth-red text-white",
    info: "bg-gray-700 text-white",
  };

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-mono font-bold rounded-full ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-t-4 border-b-4 border-afrihealth-orange ${sizeClasses[size]}`}
      />
    </div>
  );
}
