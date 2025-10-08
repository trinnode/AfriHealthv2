/**
 * File Storage Service
 * Handles file uploads to IPFS/Helia and Hedera File Service (HFS)
 * Includes encryption support for medical records
 */

import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";
import {
  FileCreateTransaction,
  FileAppendTransaction,
  Hbar,
} from "@hashgraph/sdk";
import type { Helia } from "helia";
import type { UnixFS } from "@helia/unixfs";
import { getEnhancedWalletService } from "./enhancedWalletService";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  hash?: string; // CID for IPFS, FileId for HFS
  url?: string;
  error?: string;
  storageType: "ipfs" | "hfs";
  encryptionKey?: string;
  encryptionIv?: string;
}

export interface EncryptionResult {
  encryptedData: Uint8Array;
  key: string;
  iv: string;
}

/**
 * File Storage Service
 */
export class FileStorageService {
  private helia: Helia | null = null;
  private fs: UnixFS | null = null;
  private ipfsGateway: string = "https://ipfs.io/ipfs/";
  private isInitialized: boolean = false;

  constructor() {
    this.initializeHelia();
  }

  /**
   * Initialize Helia (IPFS) node
   */
  private async initializeHelia(): Promise<void> {
    try {
      console.log("🔧 Initializing Helia IPFS node...");
      this.helia = await createHelia();
      this.fs = unixfs(this.helia);
      this.isInitialized = true;
      console.log("✅ Helia initialized");
    } catch (error) {
      console.error("❌ Failed to initialize Helia:", error);
      this.isInitialized = false;
    }
  }

  /**
   * Encrypt file data using Web Crypto API
   */
  async encryptFile(data: Uint8Array): Promise<EncryptionResult> {
    try {
      // Generate encryption key
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      // Generate IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        data.buffer as ArrayBuffer
      );

      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey("jwk", key);
      const keyString = JSON.stringify(exportedKey);

      return {
        encryptedData: new Uint8Array(encryptedBuffer),
        key: btoa(keyString),
        iv: btoa(String.fromCharCode(...iv)),
      };
    } catch (error) {
      console.error("❌ Encryption failed:", error);
      throw new Error("File encryption failed");
    }
  }

  /**
   * Decrypt file data
   */
  async decryptFile(
    encryptedData: Uint8Array,
    keyString: string,
    ivString: string
  ): Promise<Uint8Array> {
    try {
      // Import key
      const keyData = JSON.parse(atob(keyString));
      const key = await crypto.subtle.importKey(
        "jwk",
        keyData,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      // Decode IV
      const iv = new Uint8Array(
        atob(ivString)
          .split("")
          .map((c) => c.charCodeAt(0))
      );

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData.buffer as ArrayBuffer
      );

      return new Uint8Array(decryptedBuffer);
    } catch (error) {
      console.error("❌ Decryption failed:", error);
      throw new Error("File decryption failed");
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadToIPFS(
    file: File | Blob,
    options: {
      encrypt?: boolean;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResult> {
    try {
      if (!this.isInitialized || !this.fs) {
        throw new Error("Helia not initialized");
      }

      console.log("📤 Uploading to IPFS:", file);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      let data = new Uint8Array(arrayBuffer);
      let encryptionKey: string | undefined;
      let encryptionIv: string | undefined;

      // Encrypt if requested
      if (options.encrypt) {
        const encrypted = await this.encryptFile(data);
        data = new Uint8Array(encrypted.encryptedData.buffer as ArrayBuffer);
        encryptionKey = encrypted.key;
        encryptionIv = encrypted.iv;
        console.log("🔒 File encrypted");
      }

      // Add to IPFS with progress tracking
      const cid = await this.fs.addBytes(data, {
        onProgress: (evt) => {
          if (options.onProgress && typeof evt.detail === 'number') {
            options.onProgress({
              loaded: evt.detail,
              total: data.length,
              percentage: (evt.detail / data.length) * 100,
            });
          }
        },
      });

      const cidString = cid.toString();
      const url = `${this.ipfsGateway}${cidString}`;

      console.log("✅ Uploaded to IPFS:", cidString);

      return {
        success: true,
        hash: cidString,
        url,
        storageType: "ipfs",
        encryptionKey,
        encryptionIv,
      };
    } catch (error: unknown) {
      console.error("❌ IPFS upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
        storageType: "ipfs",
      };
    }
  }

  /**
   * Download file from IPFS
   */
  async downloadFromIPFS(
    cid: string,
    options: {
      decrypt?: boolean;
      encryptionKey?: string;
      encryptionIv?: string;
    } = {}
  ): Promise<Uint8Array | null> {
    try {
      if (!this.isInitialized || !this.fs) {
        throw new Error("Helia not initialized");
      }

      console.log("📥 Downloading from IPFS:", cid);

      // Parse CID
      const chunks: Uint8Array[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of this.fs.cat(cid as any)) {
        chunks.push(chunk);
      }

      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const data = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.length;
      }

      // Decrypt if needed
      if (options.decrypt && options.encryptionKey && options.encryptionIv) {
        const decrypted = await this.decryptFile(
          data,
          options.encryptionKey,
          options.encryptionIv
        );
        console.log("🔓 File decrypted");
        return decrypted;
      }

      console.log("✅ Downloaded from IPFS");
      return data;
    } catch (error) {
      console.error("❌ IPFS download failed:", error);
      return null;
    }
  }

  /**
   * Upload file to Hedera File Service (HFS)
   */
  async uploadToHFS(
    file: File | Blob,
    options: {
      encrypt?: boolean;
      memo?: string;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResult> {
    try {
      const walletService = getEnhancedWalletService();
      const client = walletService.getClient();

      if (!client) {
        throw new Error("Hedera client not available");
      }

      console.log("📤 Uploading to HFS:", file);

      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      let data = new Uint8Array(arrayBuffer);
      let encryptionKey: string | undefined;
      let encryptionIv: string | undefined;

      // Encrypt if requested
      if (options.encrypt) {
        const encrypted = await this.encryptFile(data);
        data = new Uint8Array(encrypted.encryptedData.buffer as ArrayBuffer);
        encryptionKey = encrypted.key;
        encryptionIv = encrypted.iv;
        console.log("🔒 File encrypted");
      }

      // Split file into chunks (HFS has 4KB limit per append)
      const chunkSize = 4096;
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
      }

      // Create file with first chunk
      const createTx = new FileCreateTransaction()
        .setContents(chunks[0])
        .setMaxTransactionFee(new Hbar(2));

      if (options.memo) {
        createTx.setFileMemo(options.memo);
      }

      const createResponse = await createTx.execute(client);
      const createReceipt = await createResponse.getReceipt(client);
      const fileId = createReceipt.fileId;

      if (!fileId) {
        throw new Error("Failed to create file");
      }

      console.log("✅ HFS file created:", fileId.toString());

      // Append remaining chunks
      for (let i = 1; i < chunks.length; i++) {
        const appendTx = new FileAppendTransaction()
          .setFileId(fileId)
          .setContents(chunks[i])
          .setMaxTransactionFee(new Hbar(2));

        await appendTx.execute(client);

        if (options.onProgress) {
          options.onProgress({
            loaded: (i + 1) * chunkSize,
            total: data.length,
            percentage: ((i + 1) / chunks.length) * 100,
          });
        }
      }

      console.log("✅ Uploaded to HFS:", fileId.toString());

      return {
        success: true,
        hash: fileId.toString(),
        url: `hfs://${fileId.toString()}`,
        storageType: "hfs",
        encryptionKey,
        encryptionIv,
      };
    } catch (error: unknown) {
      console.error("❌ HFS upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
        storageType: "hfs",
      };
    }
  }

  /**
   * Download file from HFS
   */
  async downloadFromHFS(
    fileId: string,
    options: {
      decrypt?: boolean;
      encryptionKey?: string;
      encryptionIv?: string;
    } = {}
  ): Promise<Uint8Array | null> {
    try {
      const walletService = getEnhancedWalletService();
      const client = walletService.getClient();

      if (!client) {
        throw new Error("Hedera client not available");
      }

      console.log("📥 Downloading from HFS:", fileId);

      // Query file contents
      const query = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/files/${fileId}`
      );
      const response = await query.json();

      if (!response.contents) {
        throw new Error("File not found");
      }

      // Decode base64 content
      const data = Uint8Array.from(atob(response.contents), (c) =>
        c.charCodeAt(0)
      );

      // Decrypt if needed
      if (options.decrypt && options.encryptionKey && options.encryptionIv) {
        const decrypted = await this.decryptFile(
          data,
          options.encryptionKey,
          options.encryptionIv
        );
        console.log("🔓 File decrypted");
        return decrypted;
      }

      console.log("✅ Downloaded from HFS");
      return data;
    } catch (error) {
      console.error("❌ HFS download failed:", error);
      return null;
    }
  }

  /**
   * Upload file (auto-selects storage based on size and preferences)
   */
  async uploadFile(
    file: File | Blob,
    options: {
      preferHFS?: boolean;
      encrypt?: boolean;
      memo?: string;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<UploadResult> {
    // Use HFS for smaller files or if preferred
    // Use IPFS for larger files (>100KB) unless HFS is preferred
    const sizeThreshold = 100 * 1024; // 100KB

    if (options.preferHFS || file.size < sizeThreshold) {
      return await this.uploadToHFS(file, options);
    } else {
      return await this.uploadToIPFS(file, options);
    }
  }

  /**
   * Download file (auto-detects storage type)
   */
  async downloadFile(
    hash: string,
    options: {
      decrypt?: boolean;
      encryptionKey?: string;
      encryptionIv?: string;
    } = {}
  ): Promise<Uint8Array | null> {
    // Detect storage type by hash format
    if (hash.startsWith("0.0.") || /^\d+\.\d+\.\d+$/.test(hash)) {
      return await this.downloadFromHFS(hash, options);
    } else {
      return await this.downloadFromIPFS(hash, options);
    }
  }

  /**
   * Convert Uint8Array to File
   */
  arrayToFile(
    data: Uint8Array,
    filename: string,
    mimeType: string = "application/octet-stream"
  ): File {
    const buffer = new Uint8Array(data.buffer as ArrayBuffer);
    return new File([buffer], filename, { type: mimeType });
  }

  /**
   * Convert Uint8Array to Blob URL for preview
   */
  arrayToBlobUrl(
    data: Uint8Array,
    mimeType: string = "application/octet-stream"
  ): string {
    const buffer = new Uint8Array(data.buffer as ArrayBuffer);
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  /**
   * Clean up Helia instance
   */
  async cleanup(): Promise<void> {
    if (this.helia) {
      await this.helia.stop();
      this.helia = null;
      this.fs = null;
      this.isInitialized = false;
      console.log("✅ Helia stopped");
    }
  }
}

// Singleton instance
let fileStorageServiceInstance: FileStorageService | null = null;

/**
 * Get file storage service instance
 */
export function getFileStorageService(): FileStorageService {
  if (!fileStorageServiceInstance) {
    fileStorageServiceInstance = new FileStorageService();
  }
  return fileStorageServiceInstance;
}

/**
 * Clean up file storage service
 */
export async function cleanupFileStorageService(): Promise<void> {
  if (fileStorageServiceInstance) {
    await fileStorageServiceInstance.cleanup();
    fileStorageServiceInstance = null;
  }
}

export default FileStorageService;
