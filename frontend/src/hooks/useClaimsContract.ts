/**
 * Enhanced Claims Hooks with Document Management
 * Combines insurance claims with multi-file upload support
 */

import { useCallback, useState } from "react";
import {
  useContractManager,
  useContractTransaction,
  useContractQuery,
} from "./useContracts";
import { useMultiFileUpload, useFileDownload } from "./useFileStorage";
import type { Claim } from "../contracts/services/ClaimsContract";

/**
 * Hook for submitting claim with supporting documents
 */
export function useSubmitClaimWithDocuments() {
  const { contractManager } = useContractManager();
  const { execute, isLoading: isTxLoading } = useContractTransaction();
  const { uploadFiles, uploads, isUploading } = useMultiFileUpload();
  const [currentStep, setCurrentStep] = useState<
    "idle" | "uploading" | "submitting" | "complete"
  >("idle");

  const submitClaim = useCallback(
    async (params: {
      poolId: string;
      amount: number;
      claimType: string;
      description: string;
      treatmentDate: number;
      provider: string;
      documents: File[];
      encrypt?: boolean;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      try {
        let documentHashes: string[] = [];

        // Step 1: Upload all supporting documents
        if (params.documents.length > 0) {
          setCurrentStep("uploading");

          const uploadResults = await uploadFiles(params.documents, {
            encrypt: params.encrypt ?? false, // Claims documents typically don't need encryption
            preferHFS: false, // Use IPFS for claim documents (can be larger)
          });

          // Extract successful uploads
          documentHashes = uploadResults
            .filter((result) => result.success && result.hash)
            .map((result) => result.hash!);

          if (documentHashes.length === 0) {
            throw new Error("Failed to upload any documents");
          }
        }

        setCurrentStep("submitting");

        // Step 2: Submit claim on blockchain
        const txResult = await execute(() =>
          contractManager.claims.submitClaim(
            params.provider,
            params.poolId,
            params.amount,
            params.claimType,
            params.description,
            documentHashes
          )
        );

        if (txResult.success) {
          setCurrentStep("complete");
        }

        return {
          ...txResult,
          documentHashes,
          uploadedCount: documentHashes.length,
          totalDocuments: params.documents.length,
        };
      } catch (error: unknown) {
        setCurrentStep("idle");
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to submit claim",
        };
      }
    },
    [contractManager, execute, uploadFiles]
  );

  const reset = useCallback(() => {
    setCurrentStep("idle");
  }, []);

  return {
    submitClaim,
    isLoading: isTxLoading || isUploading,
    uploads,
    currentStep,
    reset,
  };
}

/**
 * Hook for adding documentation to existing claim
 */
export function useAddClaimDocumentation() {
  const { contractManager } = useContractManager();
  const { execute, isLoading: isTxLoading } = useContractTransaction();
  const { uploadFiles, uploads, isUploading } = useMultiFileUpload();
  const [currentStep, setCurrentStep] = useState<
    "idle" | "uploading" | "adding" | "complete"
  >("idle");

  const addDocumentation = useCallback(
    async (params: {
      claimId: string;
      documents: File[];
      documentType: string;
      notes: string;
      encrypt?: boolean;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      try {
        setCurrentStep("uploading");

        // Upload documents
        const uploadResults = await uploadFiles(params.documents, {
          encrypt: params.encrypt ?? false,
          preferHFS: false,
        });

        const documentHashes = uploadResults
          .filter((result) => result.success && result.hash)
          .map((result) => result.hash!);

        if (documentHashes.length === 0) {
          throw new Error("Failed to upload any documents");
        }

        setCurrentStep("adding");

        // Add to claim (one transaction per document to avoid gas limits)
        const results = await Promise.all(
          documentHashes.map((hash) =>
            execute(() =>
              contractManager.claims.addClaimDocumentation(params.claimId, hash)
            )
          )
        );

        const allSuccess = results.every((r) => r.success);

        if (allSuccess) {
          setCurrentStep("complete");
        }

        return {
          success: allSuccess,
          documentHashes,
          uploadedCount: documentHashes.length,
          totalDocuments: params.documents.length,
        };
      } catch (error: unknown) {
        setCurrentStep("idle");
        const message =
          error instanceof Error
            ? error.message
            : "Failed to add documentation";
        return {
          success: false,
          error: message,
        };
      }
    },
    [contractManager, execute, uploadFiles]
  );

  const reset = useCallback(() => {
    setCurrentStep("idle");
  }, []);

  return {
    addDocumentation,
    isLoading: isTxLoading || isUploading,
    uploads,
    currentStep,
    reset,
  };
}

/**
 * Hook for reviewing claim
 */
export function useReviewClaimContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const reviewClaim = useCallback(
    async (claimId: string, approved: boolean, reviewNotes: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.claims.reviewClaim(claimId, approved, reviewNotes)
      );
    },
    [contractManager, execute]
  );

  return {
    reviewClaim,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for processing claim
 */
export function useProcessClaimContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const processClaim = useCallback(
    async (claimId: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() => contractManager.claims.processClaim(claimId));
    },
    [contractManager, execute]
  );

  return {
    processClaim,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for approving claim
 */
export function useApproveClaimContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const approveClaim = useCallback(
    async (claimId: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() => contractManager.claims.approveClaim(claimId));
    },
    [contractManager, execute]
  );

  return {
    approveClaim,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for rejecting claim
 */
export function useRejectClaimContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const rejectClaim = useCallback(
    async (claimId: string, reason: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.claims.rejectClaim(claimId, reason)
      );
    },
    [contractManager, execute]
  );

  return {
    rejectClaim,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for getting claim with document loading
 */
export function useClaimWithDocuments(claimId?: string) {
  const { contractManager, isReady } = useContractManager();
  const { downloadFile } = useFileDownload();
  const [documents, setDocuments] = useState<Map<string, Uint8Array>>(
    new Map()
  );
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const {
    data: claim,
    isLoading,
    error,
    refetch,
  } = useContractQuery<Claim | null>(
    async () => {
      if (!claimId || !contractManager) return null;
      return await contractManager.claims.getClaim(claimId);
    },
    [claimId, isReady],
    { enabled: !!claimId && isReady }
  );

  const loadDocuments = useCallback(async () => {
    if (!claim) return new Map();

    try {
      const documentHashes: string[] = claim.supportingDocs || [];

      if (documentHashes.length === 0) {
        return new Map();
      }

      setIsLoadingDocs(true);
      const docsMap = new Map<string, Uint8Array>();

      // Download all documents in parallel
      await Promise.all(
        documentHashes.map(async (hash) => {
          try {
            const data = await downloadFile(hash);
            if (data) {
              docsMap.set(hash, data);
            }
          } catch (error) {
            console.error(`Failed to load document ${hash}:`, error);
          }
        })
      );

      setDocuments(docsMap);
      return docsMap;
    } catch (error) {
      console.error("Failed to load documents:", error);
      return new Map();
    } finally {
      setIsLoadingDocs(false);
    }
  }, [claim, downloadFile]);

  return {
    claim,
    documents,
    loadDocuments,
    isLoading: isLoading || isLoadingDocs,
    error,
    refetch,
  };
}

/**
 * Hook for getting claimant claims
 */
export function useClaimantClaimsContract(
  claimant?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!claimant || !contractManager) return [];
      return await contractManager.claims.getClaimantClaims(claimant, limit);
    },
    [claimant, limit, isReady],
    { enabled: !!claimant && isReady }
  );

  return {
    claimIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed claimant claims
 */
export function useClaimantClaimsDetailed(
  claimant?: string,
  limit: number = 50
) {
  const { claimIds, isLoading: idsLoading } = useClaimantClaimsContract(
    claimant,
    limit
  );
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Claim[]>(
    async () => {
      if (!contractManager || claimIds.length === 0) return [];

      const claims = await Promise.all(
        claimIds.map((id) => contractManager.claims.getClaim(id))
      );

      return claims.filter((c): c is Claim => c !== null);
    },
    [claimIds.length, isReady],
    { enabled: claimIds.length > 0 && isReady }
  );

  return {
    claims: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting provider claims
 */
export function useProviderClaimsContract(
  provider?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!provider || !contractManager) return [];
      return await contractManager.claims.getProviderClaims(provider, limit);
    },
    [provider, limit, isReady],
    { enabled: !!provider && isReady }
  );

  return {
    claimIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed provider claims
 */
export function useProviderClaimsDetailed(
  provider?: string,
  limit: number = 50
) {
  const { claimIds, isLoading: idsLoading } = useProviderClaimsContract(
    provider,
    limit
  );
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Claim[]>(
    async () => {
      if (!contractManager || claimIds.length === 0) return [];

      const claims = await Promise.all(
        claimIds.map((id) => contractManager.claims.getClaim(id))
      );

      return claims.filter((c): c is Claim => c !== null);
    },
    [claimIds.length, isReady],
    { enabled: claimIds.length > 0 && isReady }
  );

  return {
    claims: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting pool claims
 */
export function usePoolClaimsContract(poolId?: string, limit: number = 50) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!poolId || !contractManager) return [];
      return await contractManager.claims.getPoolClaims(poolId, limit);
    },
    [poolId, limit, isReady],
    { enabled: !!poolId && isReady }
  );

  return {
    claimIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed pool claims
 */
export function usePoolClaimsDetailed(poolId?: string, limit: number = 50) {
  const { claimIds, isLoading: idsLoading } = usePoolClaimsContract(
    poolId,
    limit
  );
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Claim[]>(
    async () => {
      if (!contractManager || claimIds.length === 0) return [];

      const claims = await Promise.all(
        claimIds.map((id) => contractManager.claims.getClaim(id))
      );

      return claims.filter((c): c is Claim => c !== null);
    },
    [claimIds.length, isReady],
    { enabled: claimIds.length > 0 && isReady }
  );

  return {
    claims: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting pending claims
 */
export function usePendingClaimsContract(limit: number = 50) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!contractManager) return [];
      return await contractManager.claims.getPendingClaims(limit);
    },
    [limit, isReady],
    { enabled: isReady, refetchInterval: 30000 } // Refetch every 30s
  );

  return {
    claimIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed pending claims
 */
export function usePendingClaimsDetailed(limit: number = 50) {
  const { claimIds, isLoading: idsLoading } = usePendingClaimsContract(limit);
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Claim[]>(
    async () => {
      if (!contractManager || claimIds.length === 0) return [];

      const claims = await Promise.all(
        claimIds.map((id) => contractManager.claims.getClaim(id))
      );

      return claims.filter((c): c is Claim => c !== null);
    },
    [claimIds.length, isReady],
    { enabled: claimIds.length > 0 && isReady }
  );

  return {
    claims: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting claim statistics
 */
export function useClaimStatisticsContract(poolId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<{
    totalClaims: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    totalAmount: number;
    approvedAmount: number;
    rejectedAmount: number;
  }>(
    async () => {
      if (!poolId || !contractManager) {
        return {
          totalClaims: 0,
          pendingClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
          totalAmount: 0,
          approvedAmount: 0,
          rejectedAmount: 0,
        };
      }

      const stats = await contractManager.claims.getClaimStatistics(poolId);

      return {
        totalClaims: stats.totalClaims,
        pendingClaims: stats.pendingClaims,
        approvedClaims: stats.approvedClaims,
        rejectedClaims: stats.rejectedClaims,
        totalAmount: stats.totalAmountClaimed,
        approvedAmount: stats.totalAmountPaid,
        rejectedAmount: 0, // Not tracked by contract
      };
    },
    [poolId, isReady],
    { enabled: !!poolId && isReady, refetchInterval: 30000 } // Refetch every 30s
  );

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}
