/**
 * Identity Management Component
 * Register identity, manage credentials, and handle role-based access
 */

import React, { useState, useCallback } from "react";
import {
  useRegisterIdentityContract,
  useIdentityContract,
  useIsVerifiedContract,
  useIssueCredentialContract,
  useIdentityRolesContract,
  useAddRoleContract,
} from "../../hooks/useIdentityContract";
import { TransactionModal } from "../ui/TransactionModal";
import { useToast } from "../ui/Toast";

interface IdentityManagementProps {
  accountId: string;
  isAdmin?: boolean;
}

export const IdentityManagement: React.FC<IdentityManagementProps> = ({
  accountId,
  isAdmin = false,
}) => {
  const { showToast } = useToast();

  // Hooks
  const {
    identity,
    isLoading: loadingIdentity,
    refetch,
  } = useIdentityContract(accountId);
  const { isVerified } = useIsVerifiedContract(accountId);
  const { roles } = useIdentityRolesContract(accountId);
  const { registerIdentity, isLoading: registering } =
    useRegisterIdentityContract();
  const { issueCredential, isLoading: issuing } = useIssueCredentialContract();
  const { addRole, isLoading: addingRole } = useAddRoleContract();

  // State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [formData, setFormData] = useState({
    did: "",
    idType: "patient",
    publicKey: "",
    metadata: "",
    credentialType: "",
    credentialData: "",
    targetAccount: "",
    role: "PATIENT",
  });

  // Handle register identity
  const handleRegisterIdentity = useCallback(async () => {
    if (!formData.did || !formData.publicKey) {
      showToast({ type: "error", title: "Missing required fields" });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const result = await registerIdentity(
        formData.did,
        formData.idType,
        formData.publicKey,
        formData.metadata
      );

      if (result.success) {
        setTxStatus("success");
        showToast({
          type: "success",
          title: "Identity registered",
          message: "Your identity has been registered on-chain",
        });
        setFormData({
          ...formData,
          did: "",
          publicKey: "",
          metadata: "",
        });
        setShowRegisterModal(false);
        refetch();
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to register identity",
          message: result.error,
        });
      }
    } catch (error: unknown) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Failed to register identity",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [formData, registerIdentity, showToast, refetch]);

  // Handle issue credential
  const handleIssueCredential = useCallback(async () => {
    if (
      !formData.targetAccount ||
      !formData.credentialType ||
      !formData.credentialData
    ) {
      showToast({ type: "error", title: "Missing required fields" });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 365; // 1 year

      const result = await issueCredential(
        formData.targetAccount,
        formData.credentialType,
        formData.credentialData,
        expiresAt
      );

      if (result.success) {
        setTxStatus("success");
        showToast({
          type: "success",
          title: "Credential issued",
          message: "Credential has been issued successfully",
        });
        setFormData({
          ...formData,
          targetAccount: "",
          credentialType: "",
          credentialData: "",
        });
        setShowCredentialModal(false);
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to issue credential",
          message: result.error,
        });
      }
    } catch (error: unknown) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Failed to issue credential",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [formData, issueCredential, showToast]);

  // Handle add role
  const handleAddRole = useCallback(async () => {
    if (!formData.targetAccount || !formData.role) {
      showToast({ type: "error", title: "Missing required fields" });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const result = await addRole(formData.targetAccount, formData.role);

      if (result.success) {
        setTxStatus("success");
        showToast({
          type: "success",
          title: "Role added",
          message: `Role ${formData.role} has been assigned`,
        });
        setFormData({
          ...formData,
          targetAccount: "",
          role: "PATIENT",
        });
        setShowRoleModal(false);
        refetch();
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Failed to add role",
          message: result.error,
        });
      }
    } catch (error: unknown) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Failed to add role",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [formData, addRole, showToast, refetch]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Identity Management
        </h2>
        <div className="flex gap-2">
          {!identity && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Register Identity
            </button>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => setShowCredentialModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Issue Credential
              </button>
              <button
                onClick={() => setShowRoleModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Assign Role
              </button>
            </>
          )}
        </div>
      </div>

      {/* Identity Card */}
      {loadingIdentity ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : identity ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Identity Information
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Decentralized identifier on Hedera
              </p>
            </div>
            {isVerified && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">DID</p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {identity.did}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Identity Type</p>
              <p className="text-gray-900 capitalize">{identity.idType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account</p>
              <p className="font-mono text-sm text-gray-900">
                {identity.account}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-gray-900">{formatDate(identity.createdAt)}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Public Key</p>
              <p className="font-mono text-xs text-gray-900 break-all bg-gray-50 p-2 rounded mt-1">
                {identity.publicKey}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <p className="mt-2 text-gray-600">No identity registered</p>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Register Your Identity
          </button>
        </div>
      )}

      {/* Roles Card */}
      {roles && roles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Assigned Roles
          </h3>
          <div className="flex flex-wrap gap-2">
            {roles.map((role, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Register Identity Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Register Identity
                </h3>
                <button
                  onClick={() => setShowRegisterModal(false)}
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
                  Decentralized Identifier (DID)
                </label>
                <input
                  type="text"
                  value={formData.did}
                  onChange={(e) =>
                    setFormData({ ...formData, did: e.target.value })
                  }
                  placeholder="did:hedera:testnet:..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Identity Type
                </label>
                <select
                  value={formData.idType}
                  onChange={(e) =>
                    setFormData({ ...formData, idType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="patient">Patient</option>
                  <option value="provider">Healthcare Provider</option>
                  <option value="insurer">Insurance Provider</option>
                  <option value="organization">Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <textarea
                  value={formData.publicKey}
                  onChange={(e) =>
                    setFormData({ ...formData, publicKey: e.target.value })
                  }
                  rows={3}
                  placeholder="Enter your public key..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata (Optional)
                </label>
                <textarea
                  value={formData.metadata}
                  onChange={(e) =>
                    setFormData({ ...formData, metadata: e.target.value })
                  }
                  rows={2}
                  placeholder='{"name": "John Doe", "organization": "..."}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegisterIdentity}
                disabled={registering}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {registering ? "Registering..." : "Register Identity"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Credential Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Issue Credential
                </h3>
                <button
                  onClick={() => setShowCredentialModal(false)}
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
                  Target Account
                </label>
                <input
                  type="text"
                  value={formData.targetAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAccount: e.target.value })
                  }
                  placeholder="0.0.12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credential Type
                </label>
                <select
                  value={formData.credentialType}
                  onChange={(e) =>
                    setFormData({ ...formData, credentialType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="medical-license">Medical License</option>
                  <option value="board-certification">
                    Board Certification
                  </option>
                  <option value="insurance-verification">
                    Insurance Verification
                  </option>
                  <option value="identity-verification">
                    Identity Verification
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credential Data
                </label>
                <textarea
                  value={formData.credentialData}
                  onChange={(e) =>
                    setFormData({ ...formData, credentialData: e.target.value })
                  }
                  rows={4}
                  placeholder='{"license_number": "...", "issued_by": "...", "specialty": "..."}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueCredential}
                disabled={issuing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {issuing ? "Issuing..." : "Issue Credential"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Role
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
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
                  Target Account
                </label>
                <input
                  type="text"
                  value={formData.targetAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAccount: e.target.value })
                  }
                  placeholder="0.0.12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="PROVIDER">Healthcare Provider</option>
                  <option value="INSURER">Insurance Provider</option>
                  <option value="ADMIN">Administrator</option>
                  <option value="AUDITOR">Auditor</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRole}
                disabled={addingRole}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {addingRole ? "Assigning..." : "Assign Role"}
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
          registering
            ? "Register Identity"
            : issuing
            ? "Issue Credential"
            : "Assign Role"
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
