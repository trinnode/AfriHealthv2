/**
 * Transaction Status Modal
 * Shows transaction progress, success, and error states
 */

import React from "react";

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "idle" | "pending" | "success" | "error";
  title: string;
  message?: string;
  transactionId?: string;
  error?: string;
  steps?: {
    label: string;
    status: "pending" | "active" | "complete" | "error";
  }[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  status,
  title,
  message,
  transactionId,
  error,
  steps,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-4 ${
            status === "success"
              ? "bg-green-50"
              : status === "error"
              ? "bg-red-50"
              : "bg-blue-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {(status === "success" || status === "error") && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {status === "pending" && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            )}
            {status === "success" && (
              <div className="rounded-full bg-green-100 p-3">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {status === "error" && (
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <p className="text-center text-gray-700 mb-4">{message}</p>
          )}

          {/* Steps */}
          {steps && steps.length > 0 && (
            <div className="space-y-3 mb-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.status === "complete"
                        ? "bg-green-100"
                        : step.status === "active"
                        ? "bg-blue-100"
                        : step.status === "error"
                        ? "bg-red-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {step.status === "complete" && (
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {step.status === "active" && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                    {step.status === "error" && (
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    {step.status === "pending" && (
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={`ml-3 text-sm ${
                      step.status === "active"
                        ? "text-gray-900 font-medium"
                        : step.status === "complete"
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Transaction ID */}
          {transactionId && (
            <div className="bg-gray-50 rounded p-3 mb-4">
              <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
              <p className="text-sm text-gray-900 font-mono break-all">
                {transactionId}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(status === "success" || status === "error") && (
          <div className="px-6 py-4 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded font-medium ${
                status === "success"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
