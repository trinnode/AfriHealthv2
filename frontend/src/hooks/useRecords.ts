/**
 * Custom hooks for Medical Records management
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { useApi } from "./useApi";
import type { MedicalRecord } from "../types";

/**
 * Hook for creating medical record
 */
export function useCreateRecord() {
  return useApi(
    async (params: {
      patient: string;
      recordType: string;
      dataHash: string;
      fileHash?: string;
      metadata?: string;
    }) => {
      const response = await apiClient.createRecord(params);
      return response;
    }
  );
}

/**
 * Hook for fetching patient records
 */
export function usePatientRecords(address?: string) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPatientRecords(addr);
      setRecords(response.data?.records || []);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch records"
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchRecords(address);
    }
  }, [address, fetchRecords]);

  return {
    records,
    loading,
    error,
    refetch: () => address && fetchRecords(address),
  };
}

/**
 * Hook for fetching provider records
 */
export function useProviderRecords(address?: string) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPatientRecords(addr);
      setRecords(response.data?.records || []);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch records"
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchRecords(address);
    }
  }, [address, fetchRecords]);

  return {
    records,
    loading,
    error,
    refetch: () => address && fetchRecords(address),
  };
}

/**
 * Hook for fetching single record
 */
export function useRecord(recordId?: string) {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecord = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getRecord(id);
      setRecord(response.data?.record || null);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error || error.message || "Failed to fetch record"
      );
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (recordId) {
      fetchRecord(recordId);
    }
  }, [recordId, fetchRecord]);

  return {
    record,
    loading,
    error,
    refetch: () => recordId && fetchRecord(recordId),
  };
}

/**
 * Hook for updating record metadata
 */
export function useUpdateRecord() {
  return useApi(async (recordId: string, metadata: string) => {
    const response = await apiClient.updateRecordMetadata(recordId, metadata);
    return response;
  });
}
