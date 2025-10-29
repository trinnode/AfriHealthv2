import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useApi } from './useApi';
import type { Consent } from '../types';


export function useGrantConsent() {
  return useApi(async (params: {
    provider: string;
    scopes: string[];
    expirationTime: number;
    purpose?: string;
  }) => {
    const response = await apiClient.grantConsent(params);
    return response;
  });
}


export function useRevokeConsent() {
  return useApi(async (consentId: string) => {
    const response = await apiClient.revokeConsent(consentId);
    return response;
  });
}

/**
 * Hook for checking consent
 */
export function useCheckConsent() {
  return useApi(async (params: {
    patient: string;
    provider: string;
    scope: string;
  }) => {
    const response = await apiClient.checkConsent(params);
    return response.data?.hasConsent || false;
  });
}

/**
 * Hook for fetching patient consents
 */
export function usePatientConsents(address?: string) {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsents = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPatientConsents(addr);
      setConsents(response.data?.consents || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || 'Failed to fetch consents');
      setConsents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchConsents(address);
    }
  }, [address, fetchConsents]);

  return {
    consents,
    loading,
    error,
    refetch: () => address && fetchConsents(address),
  };
}

/**
 * Hook for fetching provider consents  
 */
export function useProviderConsents(address?: string) {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsents = useCallback(async (addr: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPatientConsents(addr);
      setConsents(response.data?.consents || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || 'Failed to fetch consents');
      setConsents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      fetchConsents(address);
    }
  }, [address, fetchConsents]);

  return {
    consents,
    loading,
    error,
    refetch: () => address && fetchConsents(address),
  };
}

/**
 * Hook for getting single consent
 */
export function useConsent(consentId?: string) {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsent = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getConsent(id);
      setConsent(response.data?.consent || null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || 'Failed to fetch consent');
      setConsent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (consentId) {
      fetchConsent(consentId);
    }
  }, [consentId, fetchConsent]);

  return {
    consent,
    loading,
    error,
    refetch: () => consentId && fetchConsent(consentId),
  };
}
