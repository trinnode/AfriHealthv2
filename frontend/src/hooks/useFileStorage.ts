/**
 * File Storage Hooks
 * React hooks for file upload/download operations
 */

import { useState, useCallback } from "react";
import { getFileStorageService } from "../services/fileStorageService";
import type {
  UploadResult,
  UploadProgress,
} from "../services/fileStorageService";

/**
 * Hook for file upload
 */
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (
      file: File | Blob,
      options: {
        preferHFS?: boolean;
        encrypt?: boolean;
        memo?: string;
      } = {}
    ) => {
      setIsUploading(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        const fileStorage = getFileStorageService();
        const uploadResult = await fileStorage.uploadFile(file, {
          ...options,
          onProgress: (prog) => setProgress(prog),
        });

        setResult(uploadResult);

        if (!uploadResult.success) {
          setError(uploadResult.error || "Upload failed");
        }

        return uploadResult;
      } catch (err: any) {
        const errorMessage = err.message || "Upload failed";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
          storageType: "ipfs" as const,
        };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    result,
    error,
    reset,
  };
}

/**
 * Hook for file download
 */
export function useFileDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [data, setData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = useCallback(
    async (
      hash: string,
      options: {
        decrypt?: boolean;
        encryptionKey?: string;
        encryptionIv?: string;
      } = {}
    ) => {
      setIsDownloading(true);
      setError(null);
      setData(null);

      try {
        const fileStorage = getFileStorageService();
        const fileData = await fileStorage.downloadFile(hash, options);

        if (!fileData) {
          throw new Error("Download failed");
        }

        setData(fileData);
        return fileData;
      } catch (err: any) {
        const errorMessage = err.message || "Download failed";
        setError(errorMessage);
        return null;
      } finally {
        setIsDownloading(false);
      }
    },
    []
  );

  const downloadAsFile = useCallback(
    (filename: string, mimeType: string = "application/octet-stream") => {
      if (!data) {
        throw new Error("No data to download");
      }

      const fileStorage = getFileStorageService();
      const file = fileStorage.arrayToFile(data, filename, mimeType);

      // Trigger download
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [data]
  );

  const getPreviewUrl = useCallback(
    (mimeType: string = "application/octet-stream"): string | null => {
      if (!data) return null;

      const fileStorage = getFileStorageService();
      return fileStorage.arrayToBlobUrl(data, mimeType);
    },
    [data]
  );

  const reset = useCallback(() => {
    setIsDownloading(false);
    setData(null);
    setError(null);
  }, []);

  return {
    downloadFile,
    downloadAsFile,
    getPreviewUrl,
    isDownloading,
    data,
    error,
    reset,
  };
}

/**
 * Hook for multiple file uploads
 */
export function useMultiFileUpload() {
  const [uploads, setUploads] = useState<
    Map<
      string,
      {
        file: File;
        progress: UploadProgress | null;
        result: UploadResult | null;
        error: string | null;
      }
    >
  >(new Map());
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(
    async (
      files: File[],
      options: {
        preferHFS?: boolean;
        encrypt?: boolean;
      } = {}
    ) => {
      setIsUploading(true);
      const fileStorage = getFileStorageService();
      const results: UploadResult[] = [];

      for (const file of files) {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;

        // Initialize upload state
        setUploads((prev) =>
          new Map(prev).set(fileId, {
            file,
            progress: null,
            result: null,
            error: null,
          })
        );

        try {
          const result = await fileStorage.uploadFile(file, {
            ...options,
            onProgress: (progress) => {
              setUploads((prev) => {
                const newMap = new Map(prev);
                const current = newMap.get(fileId);
                if (current) {
                  newMap.set(fileId, { ...current, progress });
                }
                return newMap;
              });
            },
          });

          setUploads((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(fileId);
            if (current) {
              newMap.set(fileId, {
                ...current,
                result,
                error: result.success ? null : result.error || "Upload failed",
              });
            }
            return newMap;
          });

          results.push(result);
        } catch (err: any) {
          const error = err.message || "Upload failed";
          setUploads((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(fileId);
            if (current) {
              newMap.set(fileId, { ...current, error });
            }
            return newMap;
          });

          results.push({
            success: false,
            error,
            storageType: "ipfs",
          });
        }
      }

      setIsUploading(false);
      return results;
    },
    []
  );

  const reset = useCallback(() => {
    setUploads(new Map());
    setIsUploading(false);
  }, []);

  return {
    uploadFiles,
    uploads: Array.from(uploads.entries()).map(([id, data]) => ({
      id,
      ...data,
    })),
    isUploading,
    reset,
  };
}

/**
 * Hook for file encryption/decryption
 */
export function useFileEncryption() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encryptFile = useCallback(
    async (
      file: File | Blob
    ): Promise<{
      encryptedData: Uint8Array;
      key: string;
      iv: string;
    } | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const fileStorage = getFileStorageService();
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const result = await fileStorage.encryptFile(data);
        return result;
      } catch (err: any) {
        setError(err.message || "Encryption failed");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const decryptFile = useCallback(
    async (
      encryptedData: Uint8Array,
      key: string,
      iv: string
    ): Promise<Uint8Array | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const fileStorage = getFileStorageService();
        const result = await fileStorage.decryptFile(encryptedData, key, iv);
        return result;
      } catch (err: any) {
        setError(err.message || "Decryption failed");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    encryptFile,
    decryptFile,
    isProcessing,
    error,
  };
}
