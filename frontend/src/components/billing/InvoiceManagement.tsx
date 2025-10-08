/**
 * Invoice Management Component
 * Create, view, and pay invoices with HBAR
 */

import React, { useState, useCallback } from "react";
import {
  useCreateInvoiceWithAttachment,
  usePatientInvoicesDetailed,
  useProcessPaymentWithHBAR,
  useHbarConversion,
  usePatientInvoiceStatsContract,
} from "../../hooks/useBillingContract";
import { FileUpload } from "../ui/FileUpload";
import { TransactionModal } from "../ui/TransactionModal";
import { useToast } from "../ui/Toast";

interface InvoiceManagementProps {
  accountId: string;
  isProvider?: boolean;
}

export const InvoiceManagement: React.FC<InvoiceManagementProps> = ({
  accountId,
  isProvider = false,
}) => {
  const { showToast } = useToast();
  const { formatHbar } = useHbarConversion();

  // Hooks
  const {
    invoices,
    isLoading: loadingInvoices,
    refetch,
  } = usePatientInvoicesDetailed(accountId);
  const { data: stats } = usePatientInvoiceStatsContract(accountId);
  const {
    createInvoice,
    isLoading: creating,
    currentStep,
  } = useCreateInvoiceWithAttachment();
  const { processPayment, isLoading: paying } = useProcessPaymentWithHBAR();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    patient: "",
    amount: "",
    currency: "USD",
    dueDate: "",
    description: "",
    serviceDetails: "",
  });

  // Handle create invoice
  const handleCreateInvoice = useCallback(async () => {
    if (!formData.patient || !formData.amount || !formData.description) {
      showToast({ type: "error", title: "Missing required fields" });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const dueDateTimestamp = formData.dueDate
        ? Math.floor(new Date(formData.dueDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days default

      const result = await createInvoice({
        patient: formData.patient,
        amount: parseFloat(formData.amount) * 100, // Convert to cents
        currency: formData.currency,
        dueDate: dueDateTimestamp,
        description: formData.description,
        serviceDetails: formData.serviceDetails,
        attachment: selectedFiles[0],
      });

      if (result.success) {
        setTxStatus("success");
        showToast({
          type: "success",
          title: "Invoice created",
          message: "Invoice has been created successfully",
        });
        setFormData({
          patient: "",
          amount: "",
          currency: "USD",
          dueDate: "",
          description: "",
          serviceDetails: "",
        });
        setSelectedFiles([]);
        setShowCreateModal(false);
        refetch();
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to create invoice",
          message: result.error,
        });
      }
    } catch (error: unknown) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Failed to create invoice",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [formData, selectedFiles, createInvoice, showToast, refetch]);

  // Handle payment
  const handlePayInvoice = useCallback(
    async (invoiceId: string, amountInCents: number) => {
      setShowTxModal(true);
      setTxStatus("pending");

      try {
        // Convert USD cents to HBAR (simplified conversion - real app would use exchange rate)
        const hbarAmount = amountInCents / 10000; // Assume 1 HBAR = $100 for demo

        const result = await processPayment({
          invoiceId,
          hbarAmount,
          paymentMethod: "HBAR",
          transactionReference: `pay-${Date.now()}`,
        });

        if (result.success) {
          setTxStatus("success");
          showToast({
            type: "success",
            title: "Payment successful",
            message: `Paid ${formatHbar(hbarAmount)}`,
          });
          setShowTxModal(false);
          refetch();
        } else {
          setTxStatus("error");
          showToast({
            type: "error",
            title: "Payment failed",
            message: result.error,
          });
        }
      } catch (error: unknown) {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Payment failed",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [processPayment, formatHbar, showToast, refetch]
  );

  // Format amount
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        {isProvider && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Create Invoice
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600">Paid</p>
            <p className="text-2xl font-bold text-green-900">{stats.paid}</p>
            <p className="text-xs text-green-600 mt-1">
              {formatAmount(stats.paidAmount, "USD")}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
              {stats.pending}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              {formatAmount(stats.pendingAmount, "USD")}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600">Overdue</p>
            <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {loadingInvoices ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-gray-600">No invoices found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.invoiceId}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{invoice.invoiceId.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900">
                    {invoice.services.length > 0
                      ? invoice.services.join(", ")
                      : "Medical Service"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Patient: {invoice.patient}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-gray-700">
                      Amount:{" "}
                      <strong>
                        {formatAmount(invoice.amount, invoice.currency)}
                      </strong>
                    </span>
                    <span className="text-gray-500">
                      Due: {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                </div>
                {invoice.status.toLowerCase() === "pending" && !isProvider && (
                  <button
                    onClick={() =>
                      handlePayInvoice(invoice.invoiceId, invoice.amount)
                    }
                    disabled={paying}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Invoice
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
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
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Account ID
                </label>
                <input
                  type="text"
                  value={formData.patient}
                  onChange={(e) =>
                    setFormData({ ...formData, patient: e.target.value })
                  }
                  placeholder="0.0.12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="100.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="HBAR">HBAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Medical consultation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Details
                </label>
                <textarea
                  value={formData.serviceDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceDetails: e.target.value })
                  }
                  rows={3}
                  placeholder="Detailed description of services provided..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attachment (Optional)
                </label>
                <FileUpload
                  onFileSelect={setSelectedFiles}
                  accept=".pdf"
                  maxSize={5 * 1024 * 1024}
                  showPreview
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {creating ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        status={txStatus}
        title={creating ? "Create Invoice" : "Process Payment"}
        message={
          txStatus === "pending"
            ? "Processing transaction..."
            : txStatus === "success"
            ? "Transaction completed successfully!"
            : "Transaction failed"
        }
        steps={
          creating
            ? [
                {
                  label: "Uploading attachment",
                  status:
                    currentStep === "uploading"
                      ? "active"
                      : currentStep === "creating" || currentStep === "complete"
                      ? "complete"
                      : "pending",
                },
                {
                  label: "Creating invoice",
                  status:
                    currentStep === "creating"
                      ? "active"
                      : currentStep === "complete"
                      ? "complete"
                      : "pending",
                },
              ]
            : undefined
        }
      />
    </div>
  );
};
