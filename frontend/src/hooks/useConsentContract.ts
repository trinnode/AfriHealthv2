/**
 * Enhanced Consent Hooks with Contract Integration
 * Direct contract interactions for consent management
 */

import { useCallback } from "react";
import {
  useContractManager,
  useContractTransaction,
  useContractQuery,
} from "./useContracts";
import type { Consent } from "../contracts/services/ConsentContract";

/**
 * Hook for requesting consent (contract)
 */
export function useRequestConsentContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const requestConsent = useCallback(
    async (params: {
      patient: string;
      purpose: string;
      scope: string[];
      duration: number; // in seconds
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.consent.requestConsent(
          params.patient,
          params.purpose,
          params.scope,
          params.duration
        )
      );
    },
    [contractManager, execute]
  );

  return {
    requestConsent,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for granting consent (contract)
 */
export function useGrantConsentContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const grantConsent = useCallback(
    async (consentId: string, expiresAt: number) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.consent.grantConsent(consentId, expiresAt)
      );
    },
    [contractManager, execute]
  );

  return {
    grantConsent,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for revoking consent (contract)
 */
export function useRevokeConsentContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const revokeConsent = useCallback(
    async (consentId: string, reason: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.consent.revokeConsent(consentId, reason)
      );
    },
    [contractManager, execute]
  );

  return {
    revokeConsent,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for updating consent scope (contract)
 */
export function useUpdateConsentScopeContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const updateScope = useCallback(
    async (consentId: string, newScope: string[]) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.consent.updateConsentScope(consentId, newScope)
      );
    },
    [contractManager, execute]
  );

  return {
    updateScope,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for extending consent expiry (contract)
 */
export function useExtendConsentContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const extendConsent = useCallback(
    async (consentId: string, newExpiryTime: number) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.consent.extendConsent(consentId, newExpiryTime)
      );
    },
    [contractManager, execute]
  );

  return {
    extendConsent,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for logging consent access (contract)
 */
export function useLogConsentAccessContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const logAccess = useCallback(
    async (consentId: string, accessDetails: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.consent.logConsentAccess(consentId, accessDetails)
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
 * Hook for getting consent details (contract query)
 */
export function useConsentContract(consentId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Consent>(
    async () => {
      if (!consentId || !contractManager) return null;
      return await contractManager.consent.getConsent(consentId);
    },
    [consentId, isReady],
    { enabled: !!consentId && isReady }
  );

  return {
    consent: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if consent is active (contract query)
 */
export function useIsConsentActiveContract(consentId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!consentId || !contractManager) return false;
      return await contractManager.consent.isConsentActive(consentId);
    },
    [consentId, isReady],
    { enabled: !!consentId && isReady }
  );

  return {
    isActive: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting patient consents (contract query)
 */
export function usePatientConsentsContract(
  patient?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!patient || !contractManager) return [];
      return await contractManager.consent.getPatientConsents(patient, limit);
    },
    [patient, limit, isReady],
    { enabled: !!patient && isReady }
  );

  return {
    consentIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting provider consents (contract query)
 */
export function useProviderConsentsContract(
  provider?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!provider || !contractManager) return [];
      return await contractManager.consent.getProviderConsents(provider, limit);
    },
    [provider, limit, isReady],
    { enabled: !!provider && isReady }
  );

  return {
    consentIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting active consents between patient and provider (contract query)
 */
export function useActiveConsentsContract(patient?: string, provider?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!patient || !provider || !contractManager) return [];
      return await contractManager.consent.getActiveConsents(patient, provider);
    },
    [patient, provider, isReady],
    { enabled: !!patient && !!provider && isReady }
  );

  return {
    consentIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for verifying consent for access (contract query)
 */
export function useVerifyConsentContract(
  consentId?: string,
  provider?: string,
  purpose?: string
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!consentId || !provider || !purpose || !contractManager) return false;
      return await contractManager.consent.verifyConsent(
        consentId,
        provider,
        purpose
      );
    },
    [consentId, provider, purpose, isReady],
    { enabled: !!consentId && !!provider && !!purpose && isReady }
  );

  return {
    isVerified: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting consent access history (contract query)
 */
export function useConsentAccessHistoryContract(
  consentId?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<
    Array<{ timestamp: number; accessor: string; details: string }>
  >(
    async () => {
      if (!consentId || !contractManager) return [];
      return await contractManager.consent.getConsentAccessHistory(
        consentId,
        limit
      );
    },
    [consentId, limit, isReady],
    { enabled: !!consentId && isReady }
  );

  return {
    history: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get all consent details for a patient (combines queries)
 */
export function usePatientConsentsDetailedContract(patient?: string) {
  const { consentIds, isLoading: idsLoading } =
    usePatientConsentsContract(patient);
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Consent[]>(
    async () => {
      if (!contractManager || consentIds.length === 0) return [];

      const consents = await Promise.all(
        consentIds.map((id) => contractManager.consent.getConsent(id))
      );

      return consents.filter((c): c is Consent => c !== null);
    },
    [consentIds.length, isReady],
    { enabled: consentIds.length > 0 && isReady }
  );

  return {
    consents: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}
