/**
 * Enhanced Records Hooks with File Storage Integration
 * Combines contract interactions with file upload/download
 */

import { useCallback, useState } from "react";
import {
  useContractManager,
  useContractTransaction,
  useContractQuery,
} from "./useContracts";
import { useFileUpload, useFileDownload } from "./useFileStorage";
import type {
  MedicalRecord,
  RecordAccess,
} from "../contracts/services/RecordsContract";

/**
 * Hook for registering medical record with file upload
 */
export function useRegisterRecordWithFile() {
  const { contractManager } = useContractManager();
  const {
    execute,
    isLoading: isTxLoading,
    error: txError,
  } = useContractTransaction();
  const {
    uploadFile,
    isUploading,
    progress,
    error: uploadError,
  } = useFileUpload();
  const [currentStep, setCurrentStep] = useState<
    "idle" | "uploading" | "registering" | "complete"
  >("idle");

  const registerRecord = useCallback(
    async (params: {
      file: File;
      recordType: string;
      scope: string;
      consentRequired: boolean;
      metadata: string;
      encrypt?: boolean;
      preferHFS?: boolean;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      try {
        setCurrentStep("uploading");

        // Step 1: Upload file to IPFS/HFS
        const uploadResult = await uploadFile(params.file, {
          encrypt: params.encrypt ?? true, // Default to encrypted
          preferHFS: params.preferHFS,
          memo: `Medical Record: ${params.recordType}`,
        });

        if (!uploadResult.success || !('hash' in uploadResult) || !uploadResult.hash) {
          throw new Error(uploadResult.error || "File upload failed");
        }

        setCurrentStep("registering");

        // Step 2: Register record on blockchain
        const recordHash = uploadResult.hash;
        const encryptionKey = ('encryptionKey' in uploadResult && typeof uploadResult.encryptionKey === 'string' && uploadResult.encryptionKey) || "";

        const txResult = await execute(() =>
          contractManager.records.registerRecord(
            params.recordType,
            recordHash,
            encryptionKey,
            params.scope,
            params.consentRequired,
            params.metadata
          )
        );

        if (txResult.success) {
          setCurrentStep("complete");
        }

        return {
          ...txResult,
          recordHash,
          uploadResult,
        };
      } catch (error: unknown) {
        setCurrentStep("idle");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    [contractManager, execute, uploadFile]
  );

  const reset = useCallback(() => {
    setCurrentStep("idle");
  }, []);

  return {
    registerRecord,
    isLoading: isTxLoading || isUploading,
    isUploading,
    isRegistering: isTxLoading,
    progress,
    currentStep,
    error: txError || uploadError,
    reset,
  };
}

/**
 * Hook for downloading and viewing medical record
 */
export function useViewRecord() {
  const { contractManager } = useContractManager();
  const {
    downloadFile,
    isDownloading,
    data,
    error: downloadError,
  } = useFileDownload();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const viewRecord = useCallback(
    async (recordId: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      try {
        setIsLoadingRecord(true);
        setRecordError(null);

        // Step 1: Get record details from contract
        const recordData = await contractManager.records.getRecord(recordId);

        if (!recordData) {
          throw new Error("Record not found");
        }

        setRecord(recordData);

        // Step 2: Download file from storage
        const fileData = await downloadFile(recordData.recordHash, {
          decrypt: !!recordData.encryptionKey,
          encryptionKey: recordData.encryptionKey,
          encryptionIv: "", // IV is embedded in encrypted data for our implementation
        });

        if (!fileData) {
          throw new Error("Failed to download file");
        }

        return {
          record: recordData,
          fileData,
        };
      } catch (error: unknown) {
        setRecordError(error instanceof Error ? error.message : "Failed to view record");
        return null;
      } finally {
        setIsLoadingRecord(false);
      }
    },
    [contractManager, downloadFile]
  );

  const reset = useCallback(() => {
    setRecord(null);
    setIsLoadingRecord(false);
    setRecordError(null);
  }, []);

  return {
    viewRecord,
    record,
    fileData: data,
    isLoading: isLoadingRecord || isDownloading,
    error: recordError || downloadError,
    reset,
  };
}

/**
 * Hook for logging record access
 */
export function useLogRecordAccessContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const logAccess = useCallback(
    async (recordId: string, purpose: string, consentId: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.records.logRecordAccess(recordId, purpose, consentId)
      );
    },
    [contractManager, execute]
  );

  return {
    logAccess,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for updating record URI
 */
export function useUpdateRecordContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading: isTxLoading } = useContractTransaction();
  const { uploadFile, isUploading, progress } = useFileUpload();
  const [currentStep, setCurrentStep] = useState<
    "idle" | "uploading" | "updating" | "complete"
  >("idle");

  const updateRecord = useCallback(
    async (params: {
      recordId: string;
      newFile: File;
      reason: string;
      encrypt?: boolean;
      preferHFS?: boolean;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      try {
        setCurrentStep("uploading");

        // Upload new file
        const uploadResult = await uploadFile(params.newFile, {
          encrypt: params.encrypt ?? true,
          preferHFS: params.preferHFS,
          memo: "Updated Medical Record",
        });

        if (!uploadResult.success || !('hash' in uploadResult) || !uploadResult.hash) {
          throw new Error(uploadResult.error || "File upload failed");
        }

        setCurrentStep("updating");

        // Update record on blockchain
        const txResult = await execute(() =>
          contractManager.records.updateRecordUri(
            params.recordId,
            uploadResult.hash!,
            params.reason
          )
        );

        if (txResult.success) {
          setCurrentStep("complete");
        }

        return {
          ...txResult,
          newRecordHash: uploadResult.hash,
        };
      } catch (error: unknown) {
        setCurrentStep("idle");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update record",
        };
      }
    },
    [contractManager, execute, uploadFile]
  );

  return {
    updateRecord,
    isLoading: isTxLoading || isUploading,
    progress,
    currentStep,
  };
}

/**
 * Hook for getting patient records with metadata
 */
export function usePatientRecordsContract(
  patient?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!patient || !contractManager) return [];
      return await contractManager.records.getPatientRecords(patient, limit);
    },
    [patient, limit, isReady],
    { enabled: !!patient && isReady }
  );

  return {
    recordIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed patient records (with full metadata)
 */
export function usePatientRecordsDetailed(
  patient?: string,
  limit: number = 50
) {
  const { recordIds, isLoading: idsLoading } = usePatientRecordsContract(
    patient,
    limit
  );
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<MedicalRecord[]>(
    async () => {
      if (!contractManager || recordIds.length === 0) return [];

      const records = await Promise.all(
        recordIds.map((id) => contractManager.records.getRecord(id))
      );

      return records.filter((r): r is MedicalRecord => r !== null);
    },
    [recordIds.length, isReady],
    { enabled: recordIds.length > 0 && isReady }
  );

  return {
    records: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting records by scope
 */
export function useRecordsByScopeContract(
  patient?: string,
  scope?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!patient || !scope || !contractManager) return [];
      return await contractManager.records.getRecordsByScope(
        patient,
        scope,
        limit
      );
    },
    [patient, scope, limit, isReady],
    { enabled: !!patient && !!scope && isReady }
  );

  return {
    recordIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting record access history
 */
export function useRecordAccessHistoryContract(
  recordId?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<RecordAccess[]>(
    async () => {
      if (!recordId || !contractManager) return [];
      return await contractManager.records.getRecordAccessHistory(
        recordId,
        limit
      );
    },
    [recordId, limit, isReady],
    { enabled: !!recordId && isReady }
  );

  return {
    history: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if record is accessible
 */
export function useIsRecordAccessibleContract(
  recordId?: string,
  accessor?: string,
  consentId?: string
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!recordId || !accessor || !consentId || !contractManager)
        return false;
      return await contractManager.records.isRecordAccessible(
        recordId,
        accessor,
        consentId
      );
    },
    [recordId, accessor, consentId, isReady],
    { enabled: !!recordId && !!accessor && !!consentId && isReady }
  );

  return {
    isAccessible: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if record is expired
 */
export function useIsRecordExpiredContract(recordId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!recordId || !contractManager) return false;
      return await contractManager.records.isRecordExpired(recordId);
    },
    [recordId, isReady],
    { enabled: !!recordId && isReady }
  );

  return {
    isExpired: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting expiring records
 */
export function useExpiringRecordsContract(
  withinDays: number = 30,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!contractManager) return [];
      return await contractManager.records.getExpiringRecords(
        withinDays,
        limit
      );
    },
    [withinDays, limit, isReady],
    { enabled: isReady, refetchInterval: 60000 } // Refetch every minute
  );

  return {
    recordIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for cleanup expired records
 */
export function useCleanupExpiredRecordsContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const cleanup = useCallback(
    async (maxRecords: number = 50) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.records.cleanupExpiredRecords(maxRecords)
      );
    },
    [contractManager, execute]
  );

  return {
    cleanup,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for setting retention policy
 */
export function useSetRetentionPolicyContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const setPolicy = useCallback(
    async (
      recordType: string,
      retentionPeriod: number // in seconds
    ) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.records.setRetentionPolicy(recordType, retentionPeriod)
      );
    },
    [contractManager, execute]
  );

  return {
    setPolicy,
    isLoading,
    error,
    result,
  };
}
