/**
 * Custom hooks for Insurance Claims management
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { useApi } from "./useApi";
import type { InsuranceClaim } from "../types";

/**
 * Hook for submitting insurance claim
 */
export function useSubmitClaim() {
  return useApi(
    async (params: {
      poolId: string;
      amount: number;
      claimType: string;
      description: string;
      supportingDocuments?: string[];
    }) => {
      const response = await apiClient.submitClaim(params);
      return response;
    }
  );
}

/**
 * Hook for processing claim (approve/reject)
 */
export function useProcessClaim() {
  return useApi(async (params: {
    claimId: string;
    approved: boolean;
    approvedAmount?: number;
    comments?: string;
  }) => {
    const response = await apiClient.processClaim(params);
    return response;
  });
}

/**
 * Hook for fetching patient claims
 */
export function usePatientClaims(patientId?: string) {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getUserClaims(id);
      setClaims(response.data?.claims || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || "Failed to fetch claims");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchClaims(patientId);
    }
  }, [patientId, fetchClaims]);

  return {
    claims,
    loading,
    error,
    refetch: () => patientId && fetchClaims(patientId),
  };
}

/**
 * Hook for fetching provider claims
 */
export function useProviderClaims(providerId?: string) {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaims = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getUserClaims(id);
      setClaims(response.data?.claims || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || "Failed to fetch claims");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (providerId) {
      fetchClaims(providerId);
    }
  }, [providerId, fetchClaims]);

  return {
    claims,
    loading,
    error,
    refetch: () => providerId && fetchClaims(providerId),
  };
}

/**
 * Hook for getting claim details
 */
export function useClaim(claimId?: string) {
  const [claim, setClaim] = useState<InsuranceClaim | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClaim = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getClaim(id);
      setClaim(response.data?.claim || null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || "Failed to fetch claim");
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (claimId) {
      fetchClaim(claimId);
    }
  }, [claimId, fetchClaim]);

  return {
    claim,
    loading,
    error,
    refetch: () => claimId && fetchClaim(claimId),
  };
}
