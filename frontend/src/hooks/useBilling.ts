/**
 * Custom hooks for Billing management
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { useApi } from "./useApi";
import type { Bill } from "../types";

export function useCreateInvoice() {
  return useApi(
    async (params: {
      patient: string;
      amount: number;
      serviceDescription: string;
      dueDate: number;
      metadata?: string;
    }) => {
      const response = await apiClient.createInvoice(params);
      return response;
    }
  );
}

export function usePayInvoice() {
  return useApi(
    async (params: { invoiceId: string; paymentMethod: number }) => {
      const response = await apiClient.payInvoice(
        params.invoiceId,
        params.paymentMethod
      );
      return response;
    }
  );
}

export function usePatientInvoices(patientId?: string) {
  const [invoices, setInvoices] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getPatientInvoices(id);
      if (response.success && response.data) {
        setInvoices(response.data.invoices || []);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch invoices"
      );
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchInvoices(patientId);
    }
  }, [patientId, fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch: () => patientId && fetchInvoices(patientId),
  };
}

export function useProviderInvoices(providerId?: string) {
  const [invoices, setInvoices] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getProviderInvoices(id);
      if (response.success && response.data) {
        setInvoices(response.data.invoices || []);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch invoices"
      );
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (providerId) {
      fetchInvoices(providerId);
    }
  }, [providerId, fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch: () => providerId && fetchInvoices(providerId),
  };
}

export function useInvoice(invoiceId?: string) {
  const [invoice, setInvoice] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getInvoice(id);
      if (response.success && response.data) {
        setInvoice(response.data.invoice as Bill);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch invoice"
      );
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice(invoiceId);
    }
  }, [invoiceId, fetchInvoice]);

  return {
    invoice,
    loading,
    error,
    refetch: () => invoiceId && fetchInvoice(invoiceId),
  };
}

export function useDisputeInvoice() {
  return useApi(async (params: { invoiceId: string; reason: string }) => {
    const response = await apiClient.disputeInvoice(
      params.invoiceId,
      params.reason
    );
    return response;
  });
}
