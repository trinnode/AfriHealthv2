/**
 * File Upload Component
 * Reusable file upload with drag-and-drop, progress tracking, and preview
 */

import React, { useCallback, useState } from "react";

export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 10,
  disabled = false,
  className = "",
  showPreview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; error: string | null } => {
    const valid: File[] = [];
    let errorMsg: string | null = null;

    // Check file count
    if (files.length > maxFiles) {
      errorMsg = `Maximum ${maxFiles} files allowed`;
      return { valid: [], error: errorMsg };
    }

    // Check each file
    for (const file of files) {
      if (file.size > maxSize) {
        errorMsg = `File ${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(
          2
        )}MB limit`;
        break;
      }
      valid.push(file);
    }

    return { valid, error: errorMsg };
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const { valid, error } = validateFiles(fileArray);

      if (error) {
        setError(error);
        setTimeout(() => setError(null), 5000);
        return;
      }

      setSelectedFiles(valid);
      onFileSelect(valid);
      setError(null);
    },
    [maxSize, maxFiles, onFileSelect, validateFiles]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      onFileSelect(newFiles);
    },
    [selectedFiles, onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : disabled
            ? "border-gray-300 bg-gray-50 cursor-not-allowed"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileInput}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
        />

        <label
          htmlFor="file-upload"
          className={`cursor-pointer ${disabled ? "cursor-not-allowed" : ""}`}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {accept
              ? `${accept.replace(/\./g, "").toUpperCase()} files`
              : "Any file type"}{" "}
            up to {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
          {multiple && (
            <p className="mt-1 text-xs text-gray-500">
              Maximum {maxFiles} files
            </p>
          )}
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* File Preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Selected Files ({selectedFiles.length})
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center flex-1 min-w-0">
                <svg
                  className="h-8 w-8 text-gray-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-3 text-red-600 hover:text-red-800 flex-shrink-0"
                disabled={disabled}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
