/**
 * Claims Management Component
 * Submit, review, and manage insurance claims with multi-document support
 */

import React, { useState, useCallback } from "react";
import {
  useSubmitClaimWithDocuments,
  useClaimantClaimsDetailed,
  useClaimWithDocuments,
  useApproveClaimContract,
  useRejectClaimContract,
  useClaimStatisticsContract,
} from "../../hooks/useClaimsContract";
import { FileUpload } from "../ui/FileUpload";
import { TransactionModal } from "../ui/TransactionModal";
import { ProgressBar } from "../ui/ProgressBar";
import { useToast } from "../../hooks/useToast";

interface ClaimsManagementProps {
  accountId: string;
  poolId?: string;
  isReviewer?: boolean;
}

export const ClaimsManagement: React.FC<ClaimsManagementProps> = ({
  accountId,
  poolId,
  isReviewer = false,
}) => {
  const { showToast } = useToast();

  // Hooks
  const {
    claims,
    isLoading: loadingClaims,
    refetch,
  } = useClaimantClaimsDetailed(accountId);
  const { stats } = useClaimStatisticsContract(poolId);
  const {
    submitClaim,
    isLoading: submitting,
    uploads,
    currentStep,
  } = useSubmitClaimWithDocuments();
  const {
    claim: selectedClaim,
    documents,
    loadDocuments,
  } = useClaimWithDocuments();
  const { approveClaim, isLoading: approving } = useApproveClaimContract();
  const { rejectClaim, isLoading: rejecting } = useRejectClaimContract();

  // State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    poolId: poolId || "",
    amount: "",
    claimType: "medical-treatment",
    description: "",
    treatmentDate: "",
    provider: "",
  });

  // Handle submit claim
  const handleSubmitClaim = useCallback(async () => {
    if (
      !formData.poolId ||
      !formData.amount ||
      !formData.description ||
      selectedFiles.length === 0
    ) {
      showToast({
        type: "error",
        title: "Missing required fields or documents",
      });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const treatmentDate = formData.treatmentDate
        ? Math.floor(new Date(formData.treatmentDate).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const result = await submitClaim({
        poolId: formData.poolId,
        amount: parseFloat(formData.amount) * 100, // Convert to cents
        claimType: formData.claimType,
        description: formData.description,
        treatmentDate,
        provider: formData.provider,
        documents: selectedFiles,
      });

      if (result.success) {
        setTxStatus("success");
        const uploadedCount =
          "uploadedCount" in result
            ? result.uploadedCount
            : selectedFiles.length;
        const totalDocuments =
          "totalDocuments" in result
            ? result.totalDocuments
            : selectedFiles.length;
        showToast({
          type: "success",
          title: "Claim submitted",
          message: `Uploaded ${uploadedCount}/${totalDocuments} documents`,
        });
        setFormData({
          poolId: poolId || "",
          amount: "",
          claimType: "medical-treatment",
          description: "",
          treatmentDate: "",
          provider: "",
        });
        setSelectedFiles([]);
        setShowSubmitModal(false);
        refetch();
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to submit claim",
          message: result.error,
        });
      }
    } catch (error: unknown) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Failed to submit claim",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [formData, selectedFiles, submitClaim, showToast, refetch, poolId]);

  // Handle approve claim
  const handleApproveClaim = useCallback(
    async (claimId: string) => {
      setShowTxModal(true);
      setTxStatus("pending");

      try {
        const result = await approveClaim(claimId);

        if (result.success) {
          setTxStatus("success");
          showToast({
            type: "success",
            title: "Claim approved",
            message: "Claim has been approved successfully",
          });
          refetch();
        } else {
          setTxStatus("error");
          showToast({
            type: "error",
            title: "Failed to approve claim",
            message: result.error,
          });
        }
      } catch (error: unknown) {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to approve claim",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [approveClaim, showToast, refetch]
  );

  // Handle reject claim
  const handleRejectClaim = useCallback(
    async (claimId: string, reason: string) => {
      setShowTxModal(true);
      setTxStatus("pending");

      try {
        const result = await rejectClaim(claimId, reason);

        if (result.success) {
          setTxStatus("success");
          showToast({
            type: "success",
            title: "Claim rejected",
            message: "Claim has been rejected",
          });
          refetch();
        } else {
          setTxStatus("error");
          showToast({
            type: "error",
            title: "Failed to reject claim",
            message: result.error,
          });
        }
      } catch (error: unknown) {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to reject claim",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [rejectClaim, showToast, refetch]
  );

  // Handle view claim documents
  const handleViewClaim = useCallback(async () => {
    setShowViewModal(true);
    await loadDocuments();
  }, [loadDocuments]);

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "under review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Insurance Claims</h2>
        {!isReviewer && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Submit Claim
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Claims</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalClaims}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
              {stats.pendingClaims}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-900">
              {stats.approvedClaims}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {formatAmount(stats.approvedAmount)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600">Rejected</p>
            <p className="text-2xl font-bold text-red-900">
              {stats.rejectedClaims}
            </p>
          </div>
        </div>
      )}

      {/* Claims List */}
      {loadingClaims ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : claims.length === 0 ? (
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
          <p className="mt-2 text-gray-600">No claims found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => (
            <div
              key={claim.claimId}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{claim.claimId.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold text-gray-900">
                    {claim.claimType}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {claim.description}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-gray-700">
                      Amount: <strong>{formatAmount(claim.amount)}</strong>
                    </span>
                    <span className="text-gray-500">
                      Pool: {claim.insurancePool.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewClaim()}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    View
                  </button>
                  {isReviewer && claim.status.toLowerCase() === "pending" && (
                    <>
                      <button
                        onClick={() => handleApproveClaim(claim.claimId)}
                        disabled={approving}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleRejectClaim(
                            claim.claimId,
                            "Insufficient documentation"
                          )
                        }
                        disabled={rejecting}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Claim Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Insurance Claim
                </h3>
                <button
                  onClick={() => setShowSubmitModal(false)}
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
              {!poolId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Pool ID
                  </label>
                  <input
                    type="text"
                    value={formData.poolId}
                    onChange={(e) =>
                      setFormData({ ...formData, poolId: e.target.value })
                    }
                    placeholder="pool-123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim Amount
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="1000.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim Type
                  </label>
                  <select
                    value={formData.claimType}
                    onChange={(e) =>
                      setFormData({ ...formData, claimType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="medical-treatment">Medical Treatment</option>
                    <option value="surgery">Surgery</option>
                    <option value="hospitalization">Hospitalization</option>
                    <option value="medication">Medication</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Date
                </label>
                <input
                  type="date"
                  value={formData.treatmentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, treatmentDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Account ID
                </label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  placeholder="0.0.67890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe the medical treatment and reason for claim..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supporting Documents (Required)
                </label>
                <FileUpload
                  onFileSelect={setSelectedFiles}
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  maxSize={10 * 1024 * 1024}
                  maxFiles={10}
                  showPreview
                />
                <p className="mt-2 text-xs text-gray-500">
                  Upload invoices, medical reports, prescriptions, and other
                  supporting documents
                </p>
              </div>

              {/* Upload Progress */}
              {submitting && uploads.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Uploading Documents
                  </p>
                  {uploads.map((upload) => (
                    <ProgressBar
                      key={upload.id}
                      progress={upload.progress?.percentage || 0}
                      label={upload.file.name}
                      showPercentage
                      color={
                        upload.error
                          ? "red"
                          : upload.result?.success
                          ? "green"
                          : "blue"
                      }
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitClaim}
                disabled={submitting || selectedFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Claim Modal */}
      {showViewModal && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Claim Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Claim ID</p>
                  <p className="font-medium text-gray-900">
                    {selectedClaim.claimId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                      selectedClaim.status
                    )}`}
                  >
                    {selectedClaim.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium text-gray-900">
                    {formatAmount(selectedClaim.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Claim Type</p>
                  <p className="font-medium text-gray-900">
                    {selectedClaim.claimType}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900 mt-1">
                  {selectedClaim.description}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Supporting Documents ({documents.size})
                </p>
                <div className="space-y-2">
                  {Array.from(documents.entries()).map(
                    ([hash, data], index) => (
                      <div
                        key={hash}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <svg
                            className="w-8 h-8 text-gray-400 mr-3"
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
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Document {index + 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(data.length / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Download
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
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
        title={
          submitting
            ? "Submit Claim"
            : approving
            ? "Approve Claim"
            : "Reject Claim"
        }
        message={
          txStatus === "pending"
            ? "Processing transaction..."
            : txStatus === "success"
            ? "Transaction completed successfully!"
            : "Transaction failed"
        }
        steps={
          submitting
            ? [
                {
                  label: "Uploading documents",
                  status:
                    currentStep === "uploading"
                      ? "active"
                      : currentStep === "submitting" ||
                        currentStep === "complete"
                      ? "complete"
                      : "pending",
                },
                {
                  label: "Submitting claim",
                  status:
                    currentStep === "submitting"
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
