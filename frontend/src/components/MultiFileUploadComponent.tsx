/**
 * Multi-File Upload Component
 * For submitting multiple documents (e.g., insurance claims)
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiFileUpload } from '../hooks/useFileStorage';

interface UploadResult {
  success: boolean;
  hash?: string;
  error?: string;
}

interface MultiFileUploadProps {
  onUploadComplete?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  encrypt?: boolean;
  preferHFS?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function MultiFileUploadComponent({
  onUploadComplete,
  onError,
  accept = 'image/*,application/pdf,.doc,.docx',
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  encrypt = false,
  preferHFS = false,
  disabled = false,
  label = 'Upload Multiple Files',
  description = 'Drag and drop files here, or click to select',
}: MultiFileUploadProps) {
  const { uploadFiles, uploads, isUploading, reset } = useMultiFileUpload();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setSelectedFiles((prev) => [...prev, ...acceptedFiles].slice(0, maxFiles));
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}),
    maxSize,
    multiple: true,
    disabled: disabled || isUploading,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const results = await uploadFiles(selectedFiles, {
        encrypt,
        preferHFS,
      });

      const successfulUploads = results.filter((r) => r.success);
      
      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
      }

      if (successfulUploads.length < results.length) {
        onError?.(`${results.length - successfulUploads.length} file(s) failed to upload`);
      }
    } catch (err: unknown) {
      onError?.(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    reset();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  const successCount = uploads.filter((u) => u.result?.success).length;
  const errorCount = uploads.filter((u) => u.error).length;

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <h3 className="font-mono text-lg font-bold text-white mb-1">{label}</h3>
        <p className="font-mono text-sm text-gray-400">{description}</p>
      </div>

      {/* Upload Zone */}
      {!isUploading && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-afrihealth-green bg-green-900/20' : 'border-gray-700 hover:border-afrihealth-orange'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <p className="font-mono text-lg text-white font-bold">
                {isDragActive ? 'Drop files here...' : 'Drag & drop files'}
              </p>
              <p className="font-mono text-sm text-gray-400 mt-2">
                or click to browse • Max {maxFiles} files
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && !isUploading && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-mono text-sm font-bold text-white">
              Selected Files ({selectedFiles.length})
            </h4>
            <button
              onClick={clearAll}
              className="font-mono text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white truncate">
                    {file.name}
                  </p>
                  <p className="font-mono text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-afrihealth-red transition-colors ml-3"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-700">
            <p className="font-mono text-sm text-gray-400">
              Total: {formatFileSize(totalSize)}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpload}
              disabled={disabled}
              className="px-6 py-3 bg-afrihealth-orange text-black font-mono font-bold rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
            </motion.button>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-mono text-sm font-bold text-white">
              Uploading Files ({successCount}/{uploads.length})
            </h4>
            {errorCount > 0 && (
              <span className="font-mono text-xs text-afrihealth-red">
                {errorCount} failed
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {uploads.map((upload) => (
                <motion.div
                  key={upload.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-white truncate">
                        {upload.file.name}
                      </p>
                      <p className="font-mono text-xs text-gray-400">
                        {formatFileSize(upload.file.size)}
                      </p>
                    </div>
                    {upload.result?.success && (
                      <span className="text-afrihealth-green text-xl">✅</span>
                    )}
                    {upload.error && (
                      <span className="text-afrihealth-red text-xl">❌</span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {!upload.result && !upload.error && upload.progress && (
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-xs">
                        <span className="text-gray-400">Uploading...</span>
                        <span className="text-afrihealth-orange font-bold">
                          {upload.progress.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${upload.progress.percentage}%` }}
                          className="h-full bg-gradient-to-r from-afrihealth-orange to-afrihealth-green"
                        />
                      </div>
                    </div>
                  )}

                  {/* Success Info */}
                  {upload.result?.success && (
                    <div className="font-mono text-xs text-gray-400">
                      Hash: {upload.result.hash?.substring(0, 20)}...
                    </div>
                  )}

                  {/* Error */}
                  {upload.error && (
                    <div className="font-mono text-xs text-afrihealth-red">
                      {upload.error}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Summary after upload */}
      {!isUploading && uploads.length > 0 && (
        <div className="bg-gray-900 border-2 border-gray-700 rounded-xl p-4 space-y-3">
          <h4 className="font-mono text-sm font-bold text-white">Upload Summary</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-white">{uploads.length}</p>
              <p className="font-mono text-xs text-gray-400">Total</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-afrihealth-green">{successCount}</p>
              <p className="font-mono text-xs text-gray-400">Success</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-afrihealth-red">{errorCount}</p>
              <p className="font-mono text-xs text-gray-400">Failed</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearAll}
            className="w-full py-2 bg-gray-800 text-white font-mono text-sm rounded-lg hover:bg-gray-700 transition-all"
          >
            Upload More Files
          </motion.button>
        </div>
      )}
    </div>
  );
}
