/**
 * Transaction Status Modal
 * Shows progress for blockchain transactions with file uploads
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

export type TransactionStep =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'signing'
  | 'submitting'
  | 'confirming'
  | 'success'
  | 'error';

interface TransactionStatusModalProps {
  isOpen: boolean;
  step: TransactionStep;
  progress?: number;
  message?: string;
  transactionId?: string;
  error?: string;
  onClose?: () => void;
  canClose?: boolean;
}

const stepConfig: Record<TransactionStep, { icon: string; label: string; color: string }> = {
  idle: { icon: '⏸️', label: 'Ready', color: 'text-gray-400' },
  preparing: { icon: '⚙️', label: 'Preparing', color: 'text-blue-400' },
  uploading: { icon: '📤', label: 'Uploading Files', color: 'text-orange-400' },
  signing: { icon: '✍️', label: 'Waiting for Signature', color: 'text-yellow-400' },
  submitting: { icon: '📡', label: 'Submitting Transaction', color: 'text-purple-400' },
  confirming: { icon: '⏳', label: 'Confirming on Network', color: 'text-blue-400' },
  success: { icon: '✅', label: 'Success!', color: 'text-afrihealth-green' },
  error: { icon: '❌', label: 'Error', color: 'text-afrihealth-red' },
};

export default function TransactionStatusModal({
  isOpen,
  step,
  progress,
  message,
  transactionId,
  error,
  onClose,
  canClose = false,
}: TransactionStatusModalProps) {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentStep = stepConfig[step];
  const isProcessing = !['idle', 'success', 'error'].includes(step);
  const showClose = canClose || step === 'success' || step === 'error';

  const getHashScanUrl = (txId: string) => {
    return `https://hashscan.io/testnet/transaction/${txId}`;
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={showClose ? onClose : undefined}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 border-2 border-gray-700 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="font-lora text-2xl font-bold text-white">
                    Transaction Status
                  </h2>
                  {showClose && (
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Current Step */}
                <div className="text-center space-y-4">
                  <motion.div
                    animate={isProcessing ? { rotate: 360 } : {}}
                    transition={isProcessing ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
                    className="text-6xl"
                  >
                    {currentStep.icon}
                  </motion.div>

                  <div>
                    <h3 className={`font-mono text-xl font-bold ${currentStep.color}`}>
                      {currentStep.label}
                    </h3>
                    {message && (
                      <p className="font-mono text-sm text-gray-400 mt-2">
                        {message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {progress !== undefined && progress > 0 && isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-afrihealth-orange font-bold">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-afrihealth-orange to-afrihealth-green"
                      />
                    </div>
                  </div>
                )}

                {/* Steps Timeline */}
                <div className="space-y-3">
                  {[
                    { key: 'preparing', label: 'Prepare Transaction' },
                    { key: 'uploading', label: 'Upload Files', optional: true },
                    { key: 'signing', label: 'Sign Transaction' },
                    { key: 'submitting', label: 'Submit to Network' },
                    { key: 'confirming', label: 'Confirm Transaction' },
                  ].map((stepItem, index) => {
                    const stepKey = stepItem.key as TransactionStep;
                    const stepOrder = ['preparing', 'uploading', 'signing', 'submitting', 'confirming'];
                    const currentIndex = stepOrder.indexOf(step);
                    const itemIndex = stepOrder.indexOf(stepKey);
                    
                    const isCompleted = currentIndex > itemIndex || step === 'success';
                    const isCurrent = step === stepKey;

                    return (
                      <div
                        key={stepKey}
                        className={`flex items-center gap-3 font-mono text-sm ${
                          isCompleted
                            ? 'text-afrihealth-green'
                            : isCurrent
                            ? 'text-afrihealth-orange'
                            : 'text-gray-600'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isCompleted
                              ? 'bg-afrihealth-green text-black'
                              : isCurrent
                              ? 'bg-afrihealth-orange text-black animate-pulse'
                              : 'bg-gray-800 text-gray-600'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span>{stepItem.label}</span>
                        {stepItem.optional && <span className="text-gray-600 text-xs">(optional)</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Transaction ID */}
                {transactionId && (
                  <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <p className="font-mono text-xs text-gray-400">Transaction ID</p>
                    <p className="font-mono text-sm text-white break-all">
                      {transactionId}
                    </p>
                    <a
                      href={getHashScanUrl(transactionId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-afrihealth-orange hover:text-afrihealth-green transition-colors text-sm font-mono mt-2"
                    >
                      View on HashScan →
                    </a>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/20 border border-afrihealth-red rounded-lg p-4 space-y-2">
                    <p className="font-mono text-sm font-bold text-afrihealth-red">
                      Error Details
                    </p>
                    <p className="font-mono text-xs text-gray-300 break-words">
                      {error}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {showClose && (
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className={`flex-1 py-3 px-6 rounded-xl font-mono font-bold transition-all ${
                        step === 'success'
                          ? 'bg-afrihealth-green text-black hover:bg-green-600'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      {step === 'success' ? 'Done' : 'Close'}
                    </motion.button>
                    {step === 'error' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="flex-1 py-3 px-6 rounded-xl font-mono font-bold bg-afrihealth-orange text-black hover:bg-orange-600 transition-all"
                      >
                        Retry
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

/**
 * Hook for managing transaction modal state
 */
export function useTransactionModal() {
  const [state, setState] = useState<{
    isOpen: boolean;
    step: TransactionStep;
    progress?: number;
    message?: string;
    transactionId?: string;
    error?: string;
  }>({
    isOpen: false,
    step: 'idle',
  });

  const openModal = (step: TransactionStep = 'preparing', message?: string) => {
    setState({ isOpen: true, step, message });
  };

  const updateStep = (step: TransactionStep, message?: string, progress?: number) => {
    setState((prev: typeof state) => ({ ...prev, step, message, progress }));
  };

  const setProgress = (progress: number) => {
    setState((prev: typeof state) => ({ ...prev, progress }));
  };

  const setTransactionId = (transactionId: string) => {
    setState((prev: typeof state) => ({ ...prev, transactionId }));
  };

  const setError = (error: string) => {
    setState((prev: typeof state) => ({ ...prev, step: 'error', error }));
  };

  const setSuccess = (message?: string, transactionId?: string) => {
    setState((prev: typeof state) => ({ ...prev, step: 'success', message, transactionId }));
  };

  const closeModal = () => {
    setState({ isOpen: false, step: 'idle' });
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
