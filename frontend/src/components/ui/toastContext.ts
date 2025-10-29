import { createContext } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  hideToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);
