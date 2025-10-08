/**
 * Enhanced Billing Hooks with HBAR Payment Processing
 * Combines invoice management with file attachments and payment handling
 */

import { useCallback, useState } from "react";
import { Hbar, HbarUnit } from "@hashgraph/sdk";
import {
  useContractManager,
  useContractTransaction,
  useContractQuery,
} from "./useContracts";
import { useFileUpload, useFileDownload } from "./useFileStorage";
import type { Invoice, Payment } from "../contracts/services/BillingContract";

/**
 * Hook for creating invoice with optional attachment
 */
export function useCreateInvoiceWithAttachment() {
  const { contractManager } = useContractManager();
  const { execute, isLoading: isTxLoading } = useContractTransaction();
  const { uploadFile, isUploading, progress } = useFileUpload();
  const [currentStep, setCurrentStep] = useState<
    "idle" | "uploading" | "creating" | "complete"
  >("idle");

  const createInvoice = useCallback(
    async (params: {
      patient: string;
      amount: number;
      currency: string;
      dueDate: number;
      description: string;
      serviceDetails: string;
      attachment?: File;
      encrypt?: boolean;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      try {
        let attachmentHash = "";

        // Step 1: Upload attachment if provided
        if (params.attachment) {
          setCurrentStep("uploading");

          const uploadResult = await uploadFile(params.attachment, {
            encrypt: params.encrypt ?? false, // Bills don't need encryption by default
            preferHFS: true, // Small PDFs typically < 100KB
            memo: "Invoice Attachment",
          });

          if (!uploadResult.success || !('hash' in uploadResult) || !uploadResult.hash) {
            throw new Error(uploadResult.error || "File upload failed");
          }

          attachmentHash = uploadResult.hash;
        }

        setCurrentStep("creating");

        // Step 2: Create invoice on blockchain
        const invoiceData = {
          ...params,
          metadata: JSON.stringify({
            attachmentHash,
            serviceDetails: params.serviceDetails,
          }),
        };

        const txResult = await execute(() =>
          contractManager.billing.createInvoice(
            params.patient,
            params.amount,
            params.currency,
            [params.description, params.serviceDetails],
            params.dueDate,
            invoiceData.metadata
          )
        );

        if (txResult.success) {
          setCurrentStep("complete");
        }

        return {
          ...txResult,
          attachmentHash,
        };
      } catch (error: unknown) {
        setCurrentStep("idle");
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create invoice",
        };
      }
    },
    [contractManager, execute, uploadFile]
  );

  const reset = useCallback(() => {
    setCurrentStep("idle");
  }, []);

  return {
    createInvoice,
    isLoading: isTxLoading || isUploading,
    progress,
    currentStep,
    reset,
  };
}

/**
 * Hook for processing HBAR payment
 */
export function useProcessPaymentWithHBAR() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const processPayment = useCallback(
    async (params: {
      invoiceId: string;
      hbarAmount: number; // HBAR amount (not tinybar)
      paymentMethod: string;
      transactionReference: string;
    }) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      // Convert HBAR to tinybar for payment
      const tinybarAmount = Hbar.from(
        params.hbarAmount,
        HbarUnit.Hbar
      ).toTinybars();

      return await execute(() =>
        contractManager.billing.processPayment(
          params.invoiceId,
          Number(tinybarAmount)
        )
      );
    },
    [contractManager, execute]
  );

  return {
    processPayment,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for approving invoice
 */
export function useApproveInvoiceContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const approveInvoice = useCallback(
    async (invoiceId: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.billing.approveInvoice(invoiceId)
      );
    },
    [contractManager, execute]
  );

  return {
    approveInvoice,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for rejecting invoice
 */
export function useRejectInvoiceContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const rejectInvoice = useCallback(
    async (invoiceId: string, reason: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.billing.rejectInvoice(invoiceId, reason)
      );
    },
    [contractManager, execute]
  );

  return {
    rejectInvoice,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for disputing invoice
 */
export function useDisputeInvoiceContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const disputeInvoice = useCallback(
    async (invoiceId: string, reason: string) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.billing.disputeInvoice(invoiceId, reason)
      );
    },
    [contractManager, execute]
  );

  return {
    disputeInvoice,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for getting invoice with attachment download
 */
export function useInvoiceWithAttachment(invoiceId?: string) {
  const { contractManager, isReady } = useContractManager();
  const { downloadFile } = useFileDownload();
  const [attachmentData, setAttachmentData] = useState<Uint8Array | null>(null);
  const [isLoadingAttachment, setIsLoadingAttachment] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useContractQuery<Invoice | null>(
    async () => {
      if (!invoiceId || !contractManager) return null;
      return await contractManager.billing.getInvoice(invoiceId);
    },
    [invoiceId, isReady],
    { enabled: !!invoiceId && isReady }
  );

  const loadAttachment = useCallback(async () => {
    if (!invoice) return null;

    try {
      const metadata = JSON.parse(invoice.metadata);
      const attachmentHash = metadata.attachmentHash;

      if (!attachmentHash) {
        return null;
      }

      setIsLoadingAttachment(true);
      const data = await downloadFile(attachmentHash);
      setAttachmentData(data);
      return data;
    } catch (error) {
      console.error("Failed to load attachment:", error);
      return null;
    } finally {
      setIsLoadingAttachment(false);
    }
  }, [invoice, downloadFile]);

  return {
    invoice,
    attachmentData,
    loadAttachment,
    isLoading: isLoading || isLoadingAttachment,
    error,
    refetch,
  };
}

/**
 * Hook for getting patient invoices
 */
export function usePatientInvoicesContract(
  patient?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!patient || !contractManager) return [];
      return await contractManager.billing.getPatientInvoices(patient, limit);
    },
    [patient, limit, isReady],
    { enabled: !!patient && isReady }
  );

  return {
    invoiceIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed patient invoices
 */
export function usePatientInvoicesDetailed(
  patient?: string,
  limit: number = 50
) {
  const { invoiceIds, isLoading: idsLoading } = usePatientInvoicesContract(
    patient,
    limit
  );
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Invoice[]>(
    async () => {
      if (!contractManager || invoiceIds.length === 0) return [];

      const invoices = await Promise.all(
        invoiceIds.map((id) => contractManager.billing.getInvoice(id))
      );

      return invoices.filter((inv): inv is Invoice => inv !== null);
    },
    [invoiceIds.length, isReady],
    { enabled: invoiceIds.length > 0 && isReady }
  );

  return {
    invoices: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting provider invoices
 */
export function useProviderInvoicesContract(
  provider?: string,
  limit: number = 50
) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!provider || !contractManager) return [];
      return await contractManager.billing.getProviderInvoices(provider, limit);
    },
    [provider, limit, isReady],
    { enabled: !!provider && isReady }
  );

  return {
    invoiceIds: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting detailed provider invoices
 */
export function useProviderInvoicesDetailed(
  provider?: string,
  limit: number = 50
) {
  const { invoiceIds, isLoading: idsLoading } = useProviderInvoicesContract(
    provider,
    limit
  );
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Invoice[]>(
    async () => {
      if (!contractManager || invoiceIds.length === 0) return [];

      const invoices = await Promise.all(
        invoiceIds.map((id) => contractManager.billing.getInvoice(id))
      );

      return invoices.filter((inv): inv is Invoice => inv !== null);
    },
    [invoiceIds.length, isReady],
    { enabled: invoiceIds.length > 0 && isReady }
  );

  return {
    invoices: data || [],
    isLoading: idsLoading || isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting payment details
 */
export function usePaymentContract(paymentId?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<Payment | null>(
    async () => {
      if (!paymentId || !contractManager) return null;
      return await contractManager.billing.getPayment(paymentId);
    },
    [paymentId, isReady],
    { enabled: !!paymentId && isReady }
  );

  return {
    payment: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for getting supported currencies
 */
export function useSupportedCurrenciesContract() {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<string[]>(
    async () => {
      if (!contractManager) return [];
      return await contractManager.billing.getSupportedCurrencies();
    },
    [isReady],
    { enabled: isReady }
  );

  return {
    currencies: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking if currency is supported
 */
export function useIsCurrencySupportedContract(currency?: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<boolean>(
    async () => {
      if (!currency || !contractManager) return false;
      return await contractManager.billing.isCurrencySupported(currency);
    },
    [currency, isReady],
    { enabled: !!currency && isReady }
  );

  return {
    isSupported: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for adding supported currency (admin only)
 */
export function useAddSupportedCurrencyContract() {
  const { contractManager } = useContractManager();
  const { execute, isLoading, error, result } = useContractTransaction();

  const addCurrency = useCallback(
    async (currencyCode: string, exchangeRate: number) => {
      if (!contractManager) {
        throw new Error("Contract manager not available");
      }

      return await execute(() =>
        contractManager.billing.addSupportedCurrency(currencyCode, exchangeRate)
      );
    },
    [contractManager, execute]
  );

  return {
    addCurrency,
    isLoading,
    error,
    result,
  };
}

/**
 * Hook for getting patient invoice statistics
 */
export function usePatientInvoiceStatsContract(patient: string) {
  const { contractManager, isReady } = useContractManager();

  const { data, isLoading, error, refetch } = useContractQuery<{
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }>(
    async () => {
      if (!patient || !contractManager) {
        return {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
      }

      const stats = await contractManager.billing.getPatientInvoiceStats(patient);
      
      return {
        total: stats.totalInvoices,
        paid: 0, // Calculate from invoices
        pending: 0, // Calculate from invoices
        overdue: 0, // Calculate from invoices
        totalAmount: stats.paidAmount + stats.pendingAmount,
        paidAmount: stats.paidAmount,
        pendingAmount: stats.pendingAmount,
      };
    },
    [patient, isReady],
    { enabled: !!patient && isReady, refetchInterval: 30000 } // Refetch every 30s
  );

  return { data, isLoading, error, refetch };
}
/**
 * Hook for converting HBAR to tinybar
 */
export function useHbarConversion() {
  const toTinybar = useCallback((hbar: number): bigint => {
    const long = Hbar.from(hbar, HbarUnit.Hbar).toTinybars();
    return BigInt(long.toString());
  }, []);

  const toHbar = useCallback((tinybar: number | bigint): number => {
    const value = typeof tinybar === 'bigint' ? Number(tinybar) : tinybar;
    const bigNumber = Hbar.fromTinybars(value).to(HbarUnit.Hbar);
    return Number(bigNumber.toString());
  }, []);

  const formatHbar = useCallback((hbar: number): string => {
    return `${hbar.toFixed(2)} ℏ`;
  }, []);

  const formatTinybar = useCallback(
    (tinybar: number | bigint): string => {
      const hbar = toHbar(tinybar);
      return `${hbar.toFixed(2)} ℏ`;
    },
    [toHbar]
  );

  return {
    toTinybar,
    toHbar,
    formatHbar,
    formatTinybar,
  };
}
