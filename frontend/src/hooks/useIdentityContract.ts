/**
 * Enhanced Identity Hooks with Contract Integration
 * Combines API calls with direct contract interactions
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { useApi } from "./useApi";
import {
  useContractManager,
  useContractTransaction,
  useContractQuery,
} from "./useContracts";
import type { Identity as ContractIdentity } from "../contracts/services/IdentityContract";

export interface Identity {
  accountId: string;
  did: string;
  publicKey: string;
  roles: string[];
  verificationStatus: boolean;
  credentialHashes: string[];
  registeredAt: number;
  lastUpdated: number;
  isActive: boolean;
}

/**
 * Hook for identity registration (contract-first)
 */
export function useRegisterIdentityContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const register = useCallback(
    async (params: {
      did: string;
      publicKey: string;
      roles: string[];
      metadata: string;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.identity.registerIdentity(
          params.did,
          params.publicKey,
          params.roles,
          params.metadata
        )
      );
    },
    [contractManager, execute]
  );

  return {
    register,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for fetching identity from contract
 */
export function useIdentityContract(accountId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } =
    useContractQuery<ContractIdentity>(
      async () => {
        if (!accountId || !contractManager) return null;
        return await contractManager.identity.getIdentity(accountId);
      },
      [accountId, isReady],
      { enabled: !!accountId && isReady }
    );

  return {
    identity: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for verifying identity (contract)
 */
export function useVerifyIdentityContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const verify = useCallback(
    async (accountId: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.identity.verifyIdentity(accountId)
      );
    },
    [contractManager, execute]
  );

  return {
    verify,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for checking if identity is verified (contract query)
 */
export function useIsVerifiedContract(accountId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!accountId || !contractManager) return false;
      return await contractManager.identity.isVerified(accountId);
    },
    [accountId, isReady],
    { enabled: !!accountId && isReady }
  );

  return {
    isVerified: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for adding roles (contract)
 */
export function useAddRoleContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const addRole = useCallback(
    async (accountId: string, role: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.identity.addRole(accountId, role)
      );
    },
    [contractManager, execute]
  );

  return {
    addRole,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for removing roles (contract)
 */
export function useRemoveRoleContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const removeRole = useCallback(
    async (accountId: string, role: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.identity.removeRole(accountId, role)
      );
    },
    [contractManager, execute]
  );

  return {
    removeRole,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for checking if account has specific role (contract query)
 */
export function useHasRoleContract(accountId?: string, role?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!accountId || !role || !contractManager) return false;
      return await contractManager.identity.hasRole(accountId, role);
    },
    [accountId, role, isReady],
    { enabled: !!accountId && !!role && isReady }
  );

  return {
    hasRole: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting all roles for an account (contract query)
 */
export function useIdentityRolesContract(accountId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!accountId || !contractManager) return [];
      return await contractManager.identity.getIdentityRoles(accountId);
    },
    [accountId, isReady],
    { enabled: !!accountId && isReady }
  );

  return {
    roles: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for issuing credentials (contract)
 */
export function useIssueCredentialContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const issueCredential = useCallback(
    async (params: {
      subject: string;
      credentialHash: string;
      expiresAt: number;
      credentialType: string;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.identity.issueCredential(
          params.subject,
          params.credentialHash,
          params.expiresAt,
          params.credentialType
        )
      );
    },
    [contractManager, execute]
  );

  return {
    issueCredential,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for revoking credentials (contract)
 */
export function useRevokeCredentialContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const revokeCredential = useCallback(
    async (credentialHash: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.identity.revokeCredential(credentialHash)
      );
    },
    [contractManager, execute]
  );

  return {
    revokeCredential,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for verifying credentials (contract query)
 */
export function useVerifyCredentialContract(credentialHash?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!credentialHash || !contractManager) return false;
      return await contractManager.identity.verifyCredential(credentialHash);
    },
    [credentialHash, isReady],
    { enabled: !!credentialHash && isReady }
  );

  return {
    isValid: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Legacy API-based hooks (kept for backward compatibility)
 */

export function useRegisterIdentity() {
  return useApi(
    async (params: {
      identityType: number;
      licenseNumber?: string;
      specialization?: string;
    }) => {
      const response = await apiClient.registerIdentity(params);
      return response;
    }
  );
}

export function useIdentity(address?: string) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getIdentity(addr);
      setIdentity(response.data as Identity);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch identity"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchIdentity(address);
    }
  }, [address, fetchIdentity]);

  return {
    identity,
    loading,
    error,
    refetch: () => address && fetchIdentity(address),
  };
}

export function useVerifyIdentity() {
  return useApi(async (address: string) => {
    const response = await apiClient.verifyIdentity(address);
    return response;
  });
}

export function useDeactivateIdentity() {
  return useApi(async (address: string) => {
    const response = await apiClient.deactivateIdentity(address);
    return response;
  });
}
