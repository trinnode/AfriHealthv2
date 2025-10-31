import {
  Client,
  PrivateKey,
  AccountId,
  Hbar,
  HbarUnit,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  ContractCallQuery,
  AccountBalanceQuery,
  TransferTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

// Singleton instance
let hederaServiceInstance: HederaService | null = null;


export async function getHederaClient(): Promise<Client> {
  if (!hederaServiceInstance) {
    hederaServiceInstance = new HederaService();
    await hederaServiceInstance.initialize();
  }

  if (!hederaServiceInstance.isInitialized()) {
    throw new Error(
      "Hedera service is not initialized. Please configure HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env file"
    );
  }

  return hederaServiceInstance.getClient();
}

/**
 * Hedera Service for managing blockchain operations
 * Handles all interactions with the Hedera network including contracts, transfers, and queries
 */
export class HederaService {
  private client: Client | null = null;
  private operatorId: AccountId | null = null;
  private operatorKey: PrivateKey | null = null;
  private initialized: boolean = false;

  constructor() {
    // Initialize will be called explicitly by the application
    // to handle async initialization properly
  }

  /**
   * Initialize the Hedera client
   */
  async initialize(): Promise<void> {
    try {
      // Get environment variables
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKey = process.env.HEDERA_PRIVATE_KEY;

      if (!accountId || !privateKey) {
        console.warn(
          "⚠️  HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY not configured"
        );
        console.warn(
          "⚠️  Running in development mode without Hedera connection"
        );
        console.warn(
          "⚠️  Set these in backend/.env to connect to Hedera testnet"
        );
        this.initialized = false;
        return;
      }

      // Skip initialization if using placeholder credentials
      if (accountId === "0.0.0" || privateKey.includes("00000000")) {
        console.warn("⚠️  Using placeholder Hedera credentials");
        console.warn(
          "⚠️  Running in development mode without Hedera connection"
        );
        console.warn(
          "⚠️  Get testnet credentials from https://portal.hedera.com"
        );
        this.initialized = false;
        return;
      }

      // Create Hedera client for testnet (use forMainnet() for production)
      this.client = Client.forTestnet();

      // Set operator
      this.operatorId = AccountId.fromString(accountId);
      this.operatorKey = PrivateKey.fromString(privateKey);

      this.client.setOperator(this.operatorId, this.operatorKey);
      this.initialized = true;

      console.log("✅ Hedera client initialized successfully");
      console.log(`📋 Operator Account ID: ${this.operatorId.toString()}`);
    } catch (error) {
      console.error("❌ Failed to initialize Hedera client:", error);
      console.warn(
        "⚠️  Continuing in development mode without Hedera connection"
      );
      this.initialized = false;
      // Don't throw in development mode
      if (process.env.NODE_ENV === "production") {
        throw error;
      }
    }
  }

  /**
   * Get the Hedera client instance
   */
  getClient(): Client {
    this.ensureInitialized();
    return this.client!;
  }

  /**
   * Get operator account ID
   */
  getOperatorId(): AccountId | null {
    return this.operatorId;
  }

  /**
   * Get operator private key
   */
  getOperatorKey(): PrivateKey | null {
    return this.operatorKey;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return (
      this.initialized &&
      this.client !== null &&
      this.operatorId !== null &&
      this.operatorKey !== null
    );
  }

  /**
   * Ensure the service is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error(
        "HederaService not initialized. Call initialize() first."
      );
    }
  }

  /**
   * Execute a contract function
   */
  async executeContract(
    contractId: string,
    functionName: string,
    parameters: ContractFunctionParameters,
    gas: number = 100000
  ): Promise<any> {
    this.ensureInitialized();

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(contractId)
        .setFunction(functionName, parameters)
        .setGas(gas);

      const response = await transaction.execute(this.client!);
      const receipt = await response.getReceipt(this.client!);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
      };
    } catch (error) {
      console.error("Contract execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Call a contract function (read-only)
   */
  async callContract(
    contractId: string,
    functionName: string,
    parameters: ContractFunctionParameters,
    gas: number = 100000
  ): Promise<any> {
    this.ensureInitialized();

    try {
      const query = new ContractCallQuery()
        .setContractId(contractId)
        .setFunction(functionName, parameters)
        .setGas(gas);

      const result = await query.execute(this.client!);
      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error("Contract call failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string): Promise<any> {
    this.ensureInitialized();

    try {
      const account = AccountId.fromString(accountId);
      const balance = await this.getAccountBalanceHbar(account);

      return {
        success: true,
        balance: balance.toString(),
        balanceHbar: balance,
        accountId: accountId,
      };
    } catch (error) {
      console.error("Failed to get account balance:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get account balance in HBAR
   */
  private async getAccountBalanceHbar(accountId: AccountId): Promise<Hbar> {
    this.ensureInitialized();

    const query = new AccountBalanceQuery().setAccountId(accountId);

    const balance = await query.execute(this.client!);
    return balance.hbars;
  }

  /**
   * Transfer HBAR between accounts
   */
  async transferHbar(
    toAccountId: string,
    amount: number,
    memo?: string
  ): Promise<any> {
    this.ensureInitialized();

    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error("Transfer amount must be greater than 0");
      }

      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(this.operatorId!, Hbar.from(-amount, HbarUnit.Hbar))
        .addHbarTransfer(
          AccountId.fromString(toAccountId),
          Hbar.from(amount, HbarUnit.Hbar)
        );

      if (memo) {
        transferTransaction.setTransactionMemo(memo);
      }

      const response = await transferTransaction.execute(this.client!);
      const receipt = await response.getReceipt(this.client!);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        receipt,
        amount: amount,
        from: this.operatorId!.toString(),
        to: toAccountId,
        memo: memo,
      };
    } catch (error) {
      console.error("HBAR transfer failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get operator account balance
   */
  async getOperatorBalance(): Promise<any> {
    if (!this.operatorId) {
      return {
        success: false,
        error: "Operator ID not set",
      };
    }

    return await this.getAccountBalance(this.operatorId.toString());
  }

  /**
   * Validate account ID format
   */
  static isValidAccountId(accountId: string): boolean {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean up resources
   */
  close(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.initialized = false;
      console.log("Hedera client connection closed");
    }
  }
}
