/**
 * Medical Records Management Component
 * Upload, view, and manage medical records        refetch();
      }
    } catch (error: unknown) {
      setTxStatus('error');
      showToast({
        type: 'error',
        title: 'Upload failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } storage
 */

import React, { useState, useCallback } from "react";
import {
  useRegisterRecordWithFile,
  usePatientRecordsDetailed,
  useViewRecord,
} from "../../hooks/useRecordsContract";
import { FileUpload } from "../ui/FileUpload";
import { TransactionModal } from "../ui/TransactionModal";
import { ProgressBar } from "../ui/ProgressBar";
import { useToast } from "../ui/Toast";

interface MedicalRecordsProps {
  patientId: string;
}

export const MedicalRecords: React.FC<MedicalRecordsProps> = ({
  patientId,
}) => {
  const { showToast } = useToast();

  // Hooks
  const {
    records,
    isLoading: loadingRecords,
    refetch,
  } = usePatientRecordsDetailed(patientId);
  const {
    registerRecord,
    isLoading: uploading,
    progress,
    currentStep,
    error: uploadError,
  } = useRegisterRecordWithFile();
  const { viewRecord, isLoading: viewing } = useViewRecord();

  // State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    recordType: "lab-result",
    scope: "general",
    consentRequired: true,
    description: "",
  });
  const [txStatus, setTxStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");

  // Handle file upload
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      showToast({ type: "error", title: "No file selected" });
      return;
    }

    setShowTxModal(true);
    setTxStatus("pending");

    try {
      const result = await registerRecord({
        file: selectedFiles[0],
        recordType: formData.recordType,
        scope: formData.scope,
        consentRequired: formData.consentRequired,
        metadata: JSON.stringify({
          description: formData.description,
          uploadDate: new Date().toISOString(),
        }),
        encrypt: true, // Always encrypt medical records
      });

      if (result.success) {
        setTxStatus("success");
        showToast({
          type: "success",
          title: "Record uploaded successfully",
          message: "Your medical record has been encrypted and stored",
        });
        setSelectedFiles([]);
        setFormData({
          recordType: "lab-result",
          scope: "general",
          consentRequired: true,
          description: "",
        });
        setShowUploadModal(false);
        refetch();
      } else {
        setTxStatus("error");
        showToast({
          type: "error",
          title: "Upload failed",
          message: result.error || "Failed to upload record",
        });
      }
    } catch (error: any) {
      setTxStatus("error");
      showToast({
        type: "error",
        title: "Upload failed",
        message: error.message || "An unexpected error occurred",
      });
    }
  }, [selectedFiles, formData, registerRecord, showToast, refetch]);

  // Handle view record
  const handleViewRecord = useCallback(
    async (recordId: string) => {
      try {
        const result = await viewRecord(recordId);
        if (result) {
          showToast({
            type: "success",
            title: "Record loaded",
            message: "Medical record downloaded and decrypted",
          });
        }
      } catch (error: unknown) {
        showToast({
          type: "error",
          title: "Failed to load record",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [viewRecord, showToast]
  );

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Upload Record
        </button>
      </div>

      {/* Records List */}
      {loadingRecords ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : records.length === 0 ? (
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
          <p className="mt-2 text-gray-600">No medical records found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div
              key={record.recordId}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                      {record.recordType}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {record.scope}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Patient: {record.patient}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {formatDate(record.timestamp)}
                  </p>
                  {record.encryptionKey && (
                    <span className="inline-flex items-center mt-2 text-xs text-green-700">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Encrypted
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleViewRecord(record.recordId)}
                  disabled={viewing}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Medical Record
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
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
              {/* Record Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Record Type
                </label>
                <select
                  value={formData.recordType}
                  onChange={(e) =>
                    setFormData({ ...formData, recordType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="lab-result">Lab Result</option>
                  <option value="imaging">Imaging</option>
                  <option value="prescription">Prescription</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scope
                </label>
                <select
                  value={formData.scope}
                  onChange={(e) =>
                    setFormData({ ...formData, scope: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="neurology">Neurology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="radiology">Radiology</option>
                </select>
              </div>

              {/* Description */}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the medical record..."
                />
              </div>

              {/* Consent Required */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.consentRequired}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      consentRequired: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Require consent for access
                </label>
              </div>

              {/* File Upload */}
              <FileUpload
                onFileSelect={setSelectedFiles}
                accept=".pdf,.jpg,.jpeg,.png,.dcm"
                maxSize={10 * 1024 * 1024}
                showPreview
              />
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {uploading ? "Uploading..." : "Upload Record"}
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
        title="Upload Medical Record"
        message={
          txStatus === "pending"
            ? "Processing your upload..."
            : txStatus === "success"
            ? "Medical record uploaded successfully!"
            : "Upload failed"
        }
        error={
          txStatus === "error" ? uploadError || "Upload failed" : undefined
        }
        steps={[
          {
            label: "Encrypting file",
            status:
              currentStep === "uploading" ||
              currentStep === "registering" ||
              currentStep === "complete"
                ? "complete"
                : currentStep === "idle"
                ? "pending"
                : "active",
          },
          {
            label: "Uploading to storage",
            status:
              currentStep === "registering" || currentStep === "complete"
                ? "complete"
                : currentStep === "uploading"
                ? "active"
                : "pending",
          },
          {
            label: "Registering on blockchain",
            status:
              currentStep === "complete"
                ? "complete"
                : currentStep === "registering"
                ? "active"
                : "pending",
          },
        ]}
      />

      {/* Progress Bar */}
      {uploading && progress !== null && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm w-full border border-gray-200">
          <ProgressBar
            progress={progress.percentage}
            label="Uploading medical record"
            showPercentage
            color="blue"
          />
        </div>
      )}
    </div>
  );
};
