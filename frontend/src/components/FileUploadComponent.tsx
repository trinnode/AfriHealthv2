/**
 * File Upload Component with Drag & Drop
 * Supports encryption, progress tracking, and file preview
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useFileUpload } from '../hooks/useFileStorage';
import type { UploadResult } from '../services/fileStorageService';

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  encrypt?: boolean;
  preferHFS?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
}

interface UploadedFileDisplay {
  file: File;
  preview?: string;
  result?: UploadResult;
  error?: string;
}

export default function FileUploadComponent({
  onUploadComplete,
  onError,
  accept = 'image/*,application/pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024, // 10MB default
  encrypt = false,
  preferHFS = false,
  disabled = false,
  label = 'Upload File',
  description = 'Drag and drop a file here, or click to select',
}: FileUploadProps) {
  const { uploadFile, isUploading, progress, error } = useFileUpload();
  const [uploadedFile, setUploadedFile] = useState<UploadedFileDisplay | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      setUploadedFile({ file, preview });

      try {
        const result = await uploadFile(file, {
          encrypt,
          preferHFS,
          memo: `Uploaded: ${file.name}`,
        });

        if (result.success) {
          setUploadedFile((prev) => (prev ? { ...prev, result } : null));
          onUploadComplete?.(result);
        } else {
          const errorMsg = result.error || 'Upload failed';
          setUploadedFile((prev) => (prev ? { ...prev, error: errorMsg } : null));
          onError?.(errorMsg);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed';
        setUploadedFile((prev) => (prev ? { ...prev, error: errorMsg } : null));
        onError?.(errorMsg);
      }
    },
    [uploadFile, encrypt, preferHFS, onUploadComplete, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
    maxSize,
    multiple: false,
    disabled: disabled || isUploading,
  });

  const clearFile = useCallback(() => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  }, [uploadedFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <h3 className="font-mono text-lg font-bold text-white mb-1">{label}</h3>
        <p className="font-mono text-sm text-gray-400">{description}</p>
      </div>

      {/* Upload Zone */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-afrihealth-green bg-green-900/20' : 'border-gray-700 hover:border-afrihealth-orange'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isUploading ? 'animate-pulse' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <p className="font-mono text-lg text-white font-bold">
                {isDragActive ? 'Drop file here...' : 'Drag & drop a file'}
              </p>
              <p className="font-mono text-sm text-gray-400 mt-2">
                or click to browse
              </p>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {encrypt && (
                <span className="px-3 py-1 bg-green-900/50 border border-afrihealth-green rounded-full text-xs font-mono">
                  🔒 Encrypted
                </span>
              )}
              {preferHFS && (
                <span className="px-3 py-1 bg-orange-900/50 border border-afrihealth-orange rounded-full text-xs font-mono">
                  HFS Storage
                </span>
              )}
              <span className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs font-mono text-gray-400">
                Max: {formatFileSize(maxSize)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded File Display */}
      <AnimatePresence>
        {uploadedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-900 border-2 border-gray-700 rounded-xl p-6 space-y-4"
          >
            {/* File Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-mono font-bold text-white mb-1">
                  {uploadedFile.file.name}
                </h4>
                <p className="font-mono text-sm text-gray-400">
                  {formatFileSize(uploadedFile.file.size)} • {uploadedFile.file.type || 'Unknown type'}
                </p>
              </div>
              <button
                onClick={clearFile}
                disabled={isUploading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                ❌
              </button>
            </div>

            {/* Preview */}
            {uploadedFile.preview && (
              <div className="rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={uploadedFile.preview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Progress */}
            {isUploading && progress && (
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-gray-400">Uploading...</span>
                  <span className="text-afrihealth-orange font-bold">
                    {progress.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    className="h-full bg-gradient-to-r from-afrihealth-orange to-afrihealth-green"
                  />
                </div>
                <p className="font-mono text-xs text-gray-400 text-center">
                  {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
                </p>
              </div>
            )}

            {/* Success */}
            {uploadedFile.result?.success && !isUploading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-afrihealth-green">
                  <span className="text-2xl">✅</span>
                  <span className="font-mono font-bold">Upload Complete</span>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-gray-400">Storage:</span>
                    <span className="text-white font-bold">
                      {uploadedFile.result.storageType?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-gray-400">Hash:</span>
                    <span className="text-white font-mono break-all">
                      {uploadedFile.result.hash?.substring(0, 20)}...
                    </span>
                  </div>
                  {uploadedFile.result.url && (
                    <a
                      href={uploadedFile.result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-afrihealth-orange hover:underline text-xs block"
                    >
                      View on IPFS →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {(uploadedFile.error || error) && !isUploading && (
              <div className="flex items-start gap-2 text-afrihealth-red bg-red-900/20 border border-afrihealth-red rounded-lg p-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-mono font-bold text-sm">Upload Failed</p>
                  <p className="font-mono text-xs text-gray-400 mt-1">
                    {uploadedFile.error || error}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
