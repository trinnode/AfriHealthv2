/**
 * Enhanced Wallet Service with Contract Integration
 * Manages wallet connection and contract interactions
 */

import { Client, AccountId } from "@hashgraph/sdk";
import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import {
  initializeContractManager,
  updateContractManagerClient,
  clearContractManager,
  getContractManager,
  ContractManager,
} from "../contracts/services/ContractManager";

export interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  network: "testnet" | "mainnet" | null;
  topic: string | null;
  pairingString: string | null;
  pairingData: HashConnectTypes.SavedPairingData | null;
}

export interface EnhancedTransactionResult {
  success: boolean;
  transactionId?: string;
  receipt?: any;
  error?: string;
  recordBytes?: Uint8Array;
}

/**
 * Enhanced Wallet Service with Contract Integration
 */
export class EnhancedWalletService {
  private hashconnect: HashConnect;
  private state: WalletState;
  private appMetadata: HashConnectTypes.AppMetadata;
  private client: Client | null = null;
  private contractManager: ContractManager | null = null;

  constructor() {
    this.hashconnect = new HashConnect();
    this.state = {
      isConnected: false,
      accountId: null,
      network: null,
      topic: null,
      pairingString: null,
      pairingData: null,
    };

    this.appMetadata = {
      name: "AfriHealth Ledger",
      description: "Decentralized Healthcare Management System",
      icon: "https://afrihealth.io/logo.png",
      url: window.location.origin,
    };

    this.setupEventListeners();
  }

  /**
   * Initialize HashConnect and contract manager
   */
  async initialize(
    network: "testnet" | "mainnet" = "testnet",
    diamondAddress: string
  ): Promise<void> {
    try {
      console.log("🔌 Initializing Enhanced Wallet Service...");

      this.state.network = network;

      // Initialize HashConnect
      const initData = await this.hashconnect.init(
        this.appMetadata,
        network,
        true
      );

      this.state.topic = initData.topic;
      this.state.pairingString = initData.pairingString;

      // Initialize Hedera client
      this.client =
        network === "testnet" ? Client.forTestnet() : Client.forMainnet();

      console.log("✅ HashConnect initialized");
      console.log("🔗 Pairing string:", initData.pairingString);
      console.log("🌐 Network:", network);
      console.log("💎 Diamond address:", diamondAddress);

      // Store diamond address for later use
      (window as any).__DIAMOND_ADDRESS__ = diamondAddress;
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Setup HashConnect event listeners
   */
  private setupEventListeners(): void {
    // Pairing event
    this.hashconnect.pairingEvent.on((pairingData) => {
      console.log("👥 Pairing event:", pairingData);
      this.handlePairing(pairingData);
    });

    // Connection status changes
    this.hashconnect.connectionStatusChangeEvent.on((state) => {
      console.log("🔄 Connection status:", state);
    });

    // Transaction response
    this.hashconnect.transactionEvent.on((data) => {
      console.log("📨 Transaction event:", data);
      this.handleTransactionResponse(data);
    });
  }

  /**
   * Handle pairing with wallet
   */
  private async handlePairing(
    pairingData: HashConnectTypes.SavedPairingData
  ): Promise<void> {
    try {
      const accountId = pairingData.accountIds[0];

      this.state.isConnected = true;
      this.state.accountId = accountId;
      this.state.pairingData = pairingData;

      console.log("✅ Wallet paired");
      console.log("👤 Account:", accountId);

      // Initialize contract manager
      if (this.client) {
        const diamondAddress = (window as any).__DIAMOND_ADDRESS__;
        if (diamondAddress) {
          this.contractManager = initializeContractManager(
            this.client,
            AccountId.fromString(accountId),
            { diamond: diamondAddress }
          );

          // Verify contracts are accessible
          const verification = await this.contractManager.verifyContracts();
          if (!verification.success) {
            console.warn(
              "⚠️ Contract verification issues:",
              verification.errors
            );
          } else {
            console.log("✅ Contracts verified");
          }
        }
      }

      this.dispatchConnectedEvent(accountId);
    } catch (error) {
      console.error("❌ Failed to handle pairing:", error);
    }
  }

  /**
   * Handle transaction responses
   */
  private handleTransactionResponse(
    data: MessageTypes.TransactionResponse
  ): void {
    const event = new CustomEvent("transaction:response", {
      detail: data,
    });
    window.dispatchEvent(event);
  }

  /**
   * Connect to wallet (triggers pairing modal in wallet extension)
   */
  async connect(): Promise<void> {
    try {
      console.log("🔗 Opening wallet connection...");

      if (!this.state.pairingString) {
        throw new Error("HashConnect not initialized");
      }

      // This will trigger the wallet extension's pairing modal
      console.log("📱 Please approve the connection in your wallet extension");
      console.log("🔗 Pairing string:", this.state.pairingString);

      // The actual connection happens via the pairingEvent listener
    } catch (error) {
      console.error("❌ Failed to connect:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    try {
      console.log("🔌 Disconnecting wallet...");

      if (this.state.pairingData) {
        await this.hashconnect.disconnect(this.state.pairingData.topic);
      }

      this.state.isConnected = false;
      this.state.accountId = null;
      this.state.pairingData = null;

      clearContractManager();
      this.contractManager = null;

      console.log("✅ Wallet disconnected");
      this.dispatchDisconnectedEvent();
    } catch (error) {
      console.error("❌ Failed to disconnect:", error);
      throw error;
    }
  }

  /**
   * Get contract manager instance
   */
  getContractManager(): ContractManager {
    if (!this.contractManager) {
      throw new Error(
        "Contract manager not initialized. Connect wallet first."
      );
    }
    return this.contractManager;
  }

  /**
   * Send transaction through HashConnect
   */
  async sendTransaction(
    transaction: any,
    accountId?: string
  ): Promise<EnhancedTransactionResult> {
    try {
      if (!this.state.isConnected || !this.state.pairingData) {
        throw new Error("Wallet not connected");
      }

      const targetAccountId = accountId || this.state.accountId;
      if (!targetAccountId) {
        throw new Error("No account ID available");
      }

      console.log("📤 Sending transaction...");

      // Send transaction through HashConnect
      const response = await this.hashconnect.sendTransaction(
        this.state.pairingData.topic,
        {
          topic: this.state.pairingData.topic,
          byteArray: transaction.toBytes(),
          metadata: {
            accountToSign: targetAccountId,
            returnTransaction: false,
          },
        }
      );

      if (response.success && response.receipt) {
        console.log(
          "✅ Transaction successful:",
          response.receipt.transactionId
        );
        return {
          success: true,
          transactionId: response.receipt.transactionId.toString(),
          receipt: response.receipt,
        };
      } else {
        throw new Error(response.error || "Transaction failed");
      }
    } catch (error: any) {
      console.error("❌ Transaction failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Sign message with wallet
   */
  async signMessage(
    message: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!this.state.isConnected || !this.state.pairingData) {
        throw new Error("Wallet not connected");
      }

      console.log("✍️ Signing message...");

      const response = await this.hashconnect.authenticate(
        this.state.pairingData.topic,
        this.state.accountId!,
        message
      );

      if (response.success && response.signedPayload) {
        console.log("✅ Message signed");
        return {
          success: true,
          signature: response.signedPayload.signature,
        };
      } else {
        throw new Error("Signature failed");
      }
    } catch (error: any) {
      console.error("❌ Signing failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }

  /**
   * Get connected account ID
   */
  getAccountId(): string | null {
    return this.state.accountId;
  }

  /**
   * Get pairing string for QR code
   */
  getPairingString(): string | null {
    return this.state.pairingString;
  }

  /**
   * Get Hedera client
   */
  getClient(): Client | null {
    return this.client;
  }

  /**
   * Dispatch wallet connected event
   */
  private dispatchConnectedEvent(accountId: string): void {
    const event = new CustomEvent("wallet:connected", {
      detail: {
        accountId,
        network: this.state.network,
        hasContracts: !!this.contractManager,
      },
    });
    window.dispatchEvent(event);
  }

  /**
   * Dispatch wallet disconnected event
   */
  private dispatchDisconnectedEvent(): void {
    const event = new CustomEvent("wallet:disconnected");
    window.dispatchEvent(event);
  }

  /**
   * Clear all state (for testing/development)
   */
  clearState(): void {
    this.hashconnect.clearConnectionsAndData();
    this.state = {
      isConnected: false,
      accountId: null,
      network: null,
      topic: null,
      pairingString: null,
      pairingData: null,
    };
    clearContractManager();
    this.contractManager = null;
  }
}

// Singleton instance
let enhancedWalletServiceInstance: EnhancedWalletService | null = null;

/**
 * Get enhanced wallet service instance
 */
export function getEnhancedWalletService(): EnhancedWalletService {
  if (!enhancedWalletServiceInstance) {
    enhancedWalletServiceInstance = new EnhancedWalletService();
  }
  return enhancedWalletServiceInstance;
}

/**
 * Initialize wallet service with contract integration
 */
export async function initializeWalletService(
  network: "testnet" | "mainnet" = "testnet",
  diamondAddress: string
): Promise<EnhancedWalletService> {
  const service = getEnhancedWalletService();
  await service.initialize(network, diamondAddress);
  return service;
}

export default EnhancedWalletService;
