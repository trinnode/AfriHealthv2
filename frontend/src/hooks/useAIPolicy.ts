/**
 * Custom hooks for AI Policy management
 */

import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { useApi } from "./useApi";

export function useCreateAIPolicy() {
  return useApi(
    async (params: {
      name: string;
      description: string;
      modelHash: string;
      rules: string;
    }) => {
      const response = await apiClient.createAIPolicy(params);
      return response;
    }
  );
}

export function useAssignAIPolicy() {
  return useApi(async (params: { policyId: string; patientId: string }) => {
    const response = await apiClient.assignAIPolicy(
      params.policyId,
      params.patientId
    );
    return response;
  });
}

export function useEvaluateWithAI() {
  return useApi(
    async (params: {
      claimData: Record<string, unknown>;
      recordData: Record<string, unknown>;
      invoiceData: Record<string, unknown>;
    }) => {
      const response = await apiClient.evaluateWithAI(params);
      return response;
    }
  );
}

export function useAIPolicy(policyId?: string) {
  const [policy, setPolicy] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAIPolicy(id);
      if (response.success && response.data) {
        setPolicy(response.data.policy);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error || error.message || "Failed to fetch policy"
      );
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    policy,
    loading,
    error,
    refetch: () => policyId && fetchPolicy(policyId),
  };
}

export function usePatientAIPolicy(patientId?: string) {
  const [policy, setPolicy] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPatientAIPolicy(id);
      if (response.success && response.data) {
        setPolicy(response.data.policy);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch patient policy"
      );
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    policy,
    loading,
    error,
    refetch: () => patientId && fetchPolicy(patientId),
  };
}
