/**
 * Consent Management Component
 * Request, grant, revoke, and manage healthcare data access consents
 */

import React, { useState, useCallback } from "react";
import {
  useRequestConsentContract,
  useGrantConsentContract,
  useRevokeConsentContract,
  usePatientConsentsDetailedContract,
  useProviderConsentsContract,
} from "../../hooks/useConsentContract";
import { type Consent } from "../../contracts/services/ConsentContract";
import { TransactionModal } from "../ui/TransactionModal";
import { useToast } from "../../hooks/useToast";

interface ConsentManagementProps {
  accountId: string;
  isProvider?: boolean;
}

export const ConsentManagement: React.FC<ConsentManagementProps> = ({
  accountId,
  isProvider = false,
}) => {
  const { showToast } = useToast();

  // Hooks
  const {
    consents: patientConsents,
    isLoading: loadingPatient,
    refetch: refetchPatient,
  } = usePatientConsentsDetailedContract(isProvider ? undefined : accountId);
  const { isLoading: loadingProvider, refetch: refetchProvider } =
    useProviderConsentsContract(isProvider ? accountId : undefined);
  const { requestConsent, isLoading: requesting } = useRequestConsentContract();
  const { grantConsent, isLoading: granting } = useGrantConsentContract();
  const { revokeConsent, isLoading: revoking } = useRevokeConsentContract();

  // State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    patient: "",
    provider: "",
    scope: "read",
    purpose: "",
    expiresAt: "",
  });

  const isLoading = isProvider ? loadingProvider : loadingPatient;
  const consents = isProvider ? [] : patientConsents; // Provider view shows IDs only

  // Handle request consent
  const handleRequestConsent = useCallback(async () => {
    if (!formData.patient || !formData.purpose) {
      showToast({ type: "error", title: "Missing required fields" });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const duration = formData.expiresAt
        ? Math.floor(new Date(formData.expiresAt).getTime() / 1000) -
          Math.floor(Date.now() / 1000)
        : 86400 * 365; // 1 year default

      const result = await requestConsent({
        patient: formData.patient,
        purpose: formData.purpose,
        scope: [formData.scope],
        duration,
      });

      if (result.success) {
        setTxStatus("success");
        showToast({
          type: "success",
          title: "Consent requested",
          message: "Patient will be notified of your consent request",
        });
        setFormData({
          patient: "",
          provider: "",
          scope: "read",
          purpose: "",
          expiresAt: "",
        });
        setShowRequestModal(false);
        refetchProvider();
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to request consent",
          message: result.error,
        });
      }
    } catch (error: unknown) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Failed to request consent",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [formData, requestConsent, showToast, refetchProvider]);

  // Handle grant consent
  const handleGrantConsent = useCallback(
    async (consentId: string) => {
      setShowTxModal(true);
      setTxStatus("pending");

      try {
        const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year
        const result = await grantConsent(consentId, expiresAt);

        if (result.success) {
          setTxStatus("success");
          showToast({
            type: "success",
            title: "Consent granted",
            message: "Provider can now access your data",
          });
          refetchPatient();
        } else {
          setTxStatus("error");
          showToast({
            type: "error",
            title: "Failed to grant consent",
            message: result.error,
          });
        }
      } catch (error: unknown) {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to grant consent",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [grantConsent, showToast, refetchPatient]
  );

  // Handle revoke consent
  const handleRevokeConsent = useCallback(
    async (consentId: string) => {
      setShowTxModal(true);
      setTxStatus("pending");

      try {
        const result = await revokeConsent(consentId, "Revoked by user");

        if (result.success) {
          setTxStatus("success");
          showToast({
            type: "success",
            title: "Consent revoked",
            message: "Access has been revoked",
          });
          refetchPatient();
        } else {
          setTxStatus("error");
          showToast({
            type: "error",
            title: "Failed to revoke consent",
            message: result.error,
          });
        }
      } catch (error: unknown) {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to revoke consent",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [revokeConsent, showToast, refetchPatient]
  );

  // Get consent status
  const getConsentStatus = (consent: Consent) => {
    if (consent.revoked) return "Revoked";
    if (consent.granted) {
      const now = Math.floor(Date.now() / 1000);
      if (consent.expiresAt > 0 && consent.expiresAt < now) return "Expired";
      return "Active";
    }
    return "Requested";
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
      case "active":
        return "bg-green-100 text-green-800";
      case "requested":
        return "bg-yellow-100 text-yellow-800";
      case "revoked":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Data Access Consents
        </h2>
        {isProvider && (
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Request Consent
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-600 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              {isProvider
                ? "Request consent from patients to access their medical records. Patients can grant or deny access."
                : "Manage who can access your medical records. You can grant, revoke, or review access at any time."}
            </p>
          </div>
        </div>
      </div>

      {/* Consents List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : consents.length === 0 ? (
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="mt-2 text-gray-600">No consents found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {consents.map((consent) => (
            <div
              key={consent.consentId}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(
                        getConsentStatus(consent)
                      )}`}
                    >
                      {getConsentStatus(consent)}
                    </span>
                    <span className="text-sm text-gray-500">
                      #{consent.consentId.slice(0, 8)}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Provider:</span>{" "}
                      {consent.provider}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Scope:</span>{" "}
                      {consent.scope.join(", ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Purpose:</span>{" "}
                      {consent.purpose}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Expires:</span>{" "}
                      {formatDate(consent.expiresAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {getConsentStatus(consent).toLowerCase() === "requested" &&
                    !isProvider && (
                      <button
                        onClick={() => handleGrantConsent(consent.consentId)}
                        disabled={granting}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        Grant
                      </button>
                    )}
                  {getConsentStatus(consent).toLowerCase() === "active" &&
                    !isProvider && (
                      <button
                        onClick={() => handleRevokeConsent(consent.consentId)}
                        disabled={revoking}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        Revoke
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Consent Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Request Data Access Consent
                </h3>
                <button
                  onClick={() => setShowRequestModal(false)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Scope
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) =>
                    setFormData({ ...formData, scope: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="read">Read Only</option>
                  <option value="read-write">Read & Write</option>
                  <option value="full">Full Access</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  rows={3}
                  placeholder="Describe why you need access to this patient's data..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank for 1 year default
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestConsent}
                disabled={requesting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {requesting ? "Requesting..." : "Request Consent"}
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
          requesting
            ? "Request Consent"
            : granting
            ? "Grant Consent"
            : "Revoke Consent"
        }
        message={
          txStatus === "pending"
            ? "Processing transaction..."
            : txStatus === "success"
            ? "Transaction completed successfully!"
            : "Transaction failed"
        }
      />
    </div>
  );
};
