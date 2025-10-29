import { useState } from "react";
import type { TransactionStep } from "../components/TransactionStatusModal";

interface TransactionModalState {
  isOpen: boolean;
  step: TransactionStep;
  progress?: number;
  message?: string;
  transactionId?: string;
  error?: string;
}

export function useTransactionModal() {
  const [state, setState] = useState<TransactionModalState>({
    isOpen: false,
    step: "idle",
  });

  const openModal = (step: TransactionStep = "preparing", message?: string) => {
    setState({ isOpen: true, step, message });
  };

  const updateStep = (
    step: TransactionStep,
    message?: string,
    progress?: number
  ) => {
    setState((prev) => ({ ...prev, step, message, progress }));
  };

  const setProgress = (progress: number) => {
    setState((prev) => ({ ...prev, progress }));
  };

  const setTransactionId = (transactionId: string) => {
    setState((prev) => ({ ...prev, transactionId }));
  };

  const setError = (error: string) => {
    setState((prev) => ({ ...prev, step: "error", error }));
  };

  const setSuccess = (message?: string, transactionId?: string) => {
    setState((prev) => ({ ...prev, step: "success", message, transactionId }));
  };

  const closeModal = () => {
    setState({ isOpen: false, step: "idle" });
  };

  return {
    ...state,
    openModal,
    updateStep,
    setProgress,
    setTransactionId,
    setError,
    setSuccess,
    closeModal,
  };
}
