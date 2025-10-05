/**
 * Custom hooks for Identity management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useApi } from './useApi';

export interface Identity {
  accountId: string;
  identityType: number;
  isActive: boolean;
  isVerified: boolean;
  licenseNumber?: string;
  specialization?: string;
  createdAt: number;
}

/**
 * Hook for identity registration
 */
export function useRegisterIdentity() {
  return useApi(async (params: {
    identityType: number;
    licenseNumber?: string;
    specialization?: string;
  }) => {
    const response = await apiClient.registerIdentity(params);
    return response;
  });
}

/**
 * Hook for fetching identity details
 */
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
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || 'Failed to fetch identity');
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

/**
 * Hook for verifying identity
 */
export function useVerifyIdentity() {
  return useApi(async (address: string) => {
    const response = await apiClient.verifyIdentity(address);
    return response;
  });
}

/**
 * Hook for deactivating identity
 */
export function useDeactivateIdentity() {
  return useApi(async (address: string) => {
    const response = await apiClient.deactivateIdentity(address);
    return response;
  });
}
