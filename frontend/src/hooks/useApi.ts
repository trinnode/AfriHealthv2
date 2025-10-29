/**
 * Custom React Hook for API calls with loading and error states
 */

import { useState, useCallback, useEffect } from "react";
import { extractErrorMessage } from "../utils/error";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T, P extends unknown[] = []> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: P) => Promise<T | null>;
  reset: () => void;
}


export function useApi<T, P extends unknown[] = []>(
  apiFunction: (...args: P) => Promise<T>
): UseApiReturn<T, P> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: unknown) {
        const errorMessage = extractErrorMessage(err);
        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for automatic data fetching on mount
 */
export function useApiQuery<T>(
  apiFunction: () => Promise<T>
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await apiFunction();
      setState({ data: result, loading: false, error: null });
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [apiFunction]);

  // Initial fetch
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}
