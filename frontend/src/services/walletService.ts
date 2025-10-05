/**
 * Simplified Wallet Service for AfriHealth Ledger
 * Development version with simulated wallet connectivity
 */

export interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  network: string | null;
  topic: string | null;
  pairingString: string | null;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  receipt?: unknown;
  error?: string;
}

/**
 * HashPack Wallet Integration Service
 */
export class WalletService {
  private state: WalletState;

  constructor() {
    this.state = {
      isConnected: false,
      accountId: null,
      network: null,
      topic: null,
      pairingString: null,
    };
  }

  /**
   * Initialize HashConnect
   */
  async initialize(network: "testnet" | "mainnet" = "testnet"): Promise<void> {
    try {
      console.log("🔌 Initializing HashConnect...");

      this.state.network = network;

      console.log("✅ HashConnect initialized (development mode)");
      console.log("🌐 Network:", network);
    } catch (error) {
      console.error("❌ Failed to initialize HashConnect:", error);
      throw error;
    }
  }

  /**
   * Connect to wallet
   */
  async connect(): Promise<void> {
    try {
      console.log("🔗 Connecting to wallet...");

      // Simulate successful connection for development
      const mockAccountId = "0.0.123456";
      this.state.isConnected = true;
      this.state.accountId = mockAccountId;

      console.log("✅ Wallet connected");
      console.log("👤 Account:", mockAccountId);

      this.dispatchConnectedEvent(mockAccountId);
    } catch (error) {
      console.error("❌ Failed to connect wallet:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    try {
      console.log("🔌 Disconnecting wallet...");

      this.state.isConnected = false;
      this.state.accountId = null;

      console.log("✅ Wallet disconnected");

      this.dispatchDisconnectedEvent();
    } catch (error) {
      console.error("❌ Failed to disconnect:", error);
      throw error;
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
   * Send transaction
   */
  async sendTransaction(_transaction: unknown): Promise<TransactionResult> {
    try {
      if (!this.state.isConnected) {
        throw new Error("Wallet not connected");
      }

      console.log("📤 Sending transaction...");

      const mockTxId = `0.0.${Date.now()}@${Math.floor(
        Date.now() / 1000
      )}.${Math.floor(Math.random() * 1000000000)}`;

      console.log("✅ Transaction sent:", mockTxId);

      return {
        success: true,
        transactionId: mockTxId,
      };
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sign message
   */
  async signMessage(
    _message: string
  ): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      if (!this.state.isConnected) {
        throw new Error("Wallet not connected");
      }

      console.log("✍️ Signing message...");

      const mockSignature = `0x${Math.random().toString(16).substring(2)}`;

      return {
        success: true,
        signature: mockSignature,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Dispatch wallet connected event
   */
  private dispatchConnectedEvent(accountId: string): void {
    const event = new CustomEvent("wallet:connected", {
      detail: { accountId, network: this.state.network },
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
}

// Singleton instance
let walletServiceInstance: WalletService | null = null;

/**
 * Get wallet service instance
 */
export function getWalletService(): WalletService {
  if (!walletServiceInstance) {
    walletServiceInstance = new WalletService();
  }
  return walletServiceInstance;
}

export default WalletService;
