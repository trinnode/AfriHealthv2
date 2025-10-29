/**
 * Enhanced Contract Hooks
 * React hooks for seamless contract interactions
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type DependencyList,
} from "react";
import { getEnhancedWalletService } from "../services/enhancedWalletService";
import type { ContractManager } from "../contracts/services/ContractManager";
import type { TransactionResult } from "../contracts/services/HederaContractService";
import { extractErrorMessage } from "../utils/error";

interface WalletConnectedEventDetail {
  accountId: string | null;
  network: "testnet" | "mainnet" | null;
  topic?: string | null;
  pairingString?: string | null;
  hasContracts?: boolean;
}

interface ContractQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to access contract manager
 */
export function useContractManager() {
  const [contractManager, setContractManager] =
    useState<ContractManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const walletService = getEnhancedWalletService();

    const handleConnected = () => {
      try {
        const manager = walletService.getContractManager();
        setContractManager(manager);
        setIsReady(true);
        setError(null);
      } catch (error: unknown) {
        setError(extractErrorMessage(error));
        setIsReady(false);
      }
    };

    const handleDisconnected = () => {
      setContractManager(null);
      setIsReady(false);
      setError(null);
    };

    // Check current state
    if (walletService.isConnected()) {
      handleConnected();
    }

    // Listen for wallet events
    window.addEventListener("wallet:connected", handleConnected);
    window.addEventListener("wallet:disconnected", handleDisconnected);

    return () => {
      window.removeEventListener("wallet:connected", handleConnected);
      window.removeEventListener("wallet:disconnected", handleDisconnected);
    };
  }, []);

  return { contractManager, isReady, error };
}

/**
 * Hook for contract transactions with loading and error states
 */
export function useContractTransaction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransactionResult | null>(null);

  const execute = useCallback(
    async (transactionFn: () => Promise<TransactionResult>) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const txResult = await transactionFn();
        setResult(txResult);

        if (!txResult.success) {
          setError(txResult.error || "Transaction failed");
        }

        return txResult;
      } catch (error: unknown) {
        const errorMessage = extractErrorMessage(
          error,
          "Transaction execution failed"
        );
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    result,
    reset,
  };
}

/**
 * Hook for contract queries with caching
 */
export function useContractQuery<T>(
  queryFn: () => Promise<T | null>,
  dependencies: DependencyList = [],
  options: ContractQueryOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const { enabled = true, refetchInterval } = options;
  const dependencyToken = useMemo(
    () => createDependencyToken(dependencies),
    [dependencies]
  );

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      setLastFetch(Date.now());
    } catch (error: unknown) {
      setError(extractErrorMessage(error, "Query failed"));
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refetch();
  }, [dependencyToken, enabled, refetch]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(refetch, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, enabled, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    lastFetch,
  };
}

/**
 * Hook to check wallet connection status
 */
export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [hasContracts, setHasContracts] = useState(false);

  useEffect(() => {
    const walletService = getEnhancedWalletService();

    const updateConnectionState = () => {
      const state = walletService.getState();
      setIsConnected(state.isConnected);
      setAccountId(state.accountId);

      try {
        const manager = walletService.getContractManager();
        setHasContracts(!!manager);
      } catch {
        setHasContracts(false);
      }
    };

    const handleConnected = (event: Event) => {
      const detail = (event as CustomEvent<WalletConnectedEventDetail>).detail;
      setIsConnected(true);
      setAccountId(detail?.accountId ?? null);
      setHasContracts(detail?.hasContracts ?? false);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setAccountId(null);
      setHasContracts(false);
    };

    // Initial state
    updateConnectionState();

    // Listen for events
    window.addEventListener("wallet:connected", handleConnected);
    window.addEventListener("wallet:disconnected", handleDisconnected);

    return () => {
      window.removeEventListener("wallet:connected", handleConnected);
      window.removeEventListener("wallet:disconnected", handleDisconnected);
    };
  }, []);

  return {
    isConnected,
    accountId,
    hasContracts,
  };
}

/**
 * Hook to listen for transaction events
 */
export function useTransactionListener<T = unknown>(
  callback: (data: T) => void
) {
  useEffect(() => {
    const handleTransaction = (event: Event) => {
      if (!("detail" in event)) {
        return;
      }
      const customEvent = event as CustomEvent<T>;
      callback(customEvent.detail);
    };

    window.addEventListener("transaction:response", handleTransaction);

    return () => {
      window.removeEventListener("transaction:response", handleTransaction);
    };
  }, [callback]);
}

function createDependencyToken(dependencies: DependencyList): string {
  return dependencies
    .map((dependency) => {
      if (dependency === null) return "null";
      if (dependency === undefined) return "undefined";
      if (typeof dependency === "object") {
        try {
          return JSON.stringify(dependency);
        } catch {
          return "[object]";
        }
      }
      if (typeof dependency === "function") {
        return dependency.name || "anonymous";
      }
      return String(dependency);
    })
    .join("|");
}
