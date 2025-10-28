/**
 * Hedera Contract Service
 * Core service for interacting with Hedera smart contracts
 */

import {
  AccountId,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractFunctionResult,
  ContractId,
  Hbar,
  TransactionReceipt,
} from "@hashgraph/sdk";

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  receipt?: TransactionReceipt;
  error?: string;
  recordBytes?: Uint8Array;
}

export interface ContractCallResult {
  success: boolean;
  data?: ContractFunctionResult;
  error?: string;
}

export interface ContractInfoResult {
  success: boolean;
  contractId: string;
  exists: boolean;
  error?: string;
}

export interface TransactionOptions {
  gas?: number;
  payableAmount?: number; // in HBAR
  memo?: string;
}

/**
 * Service for executing and querying Hedera smart contracts
 */
export class HederaContractService {
  private client: Client;
  private accountId: AccountId;

  constructor(client: Client, accountId: AccountId) {
    this.client = client;
    this.accountId = accountId;
  }

  /**
   * Execute a contract function (write operation)
   */
  async executeContract(
    contractId: string,
    functionName: string,
    functionParams: ContractFunctionParameters,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(options.gas || 1000000)
        .setFunction(functionName, functionParams);

      // Add payable amount if specified
      if (options.payableAmount) {
        transaction.setPayableAmount(new Hbar(options.payableAmount));
      }

      // Add memo if specified
      if (options.memo) {
        transaction.setTransactionMemo(options.memo);
      }

      // Freeze and sign transaction
      const txResponse = await transaction.execute(this.client);

      // Get receipt
      const receipt = await txResponse.getReceipt(this.client);

      // Get record for detailed info
      const record = await txResponse.getRecord(this.client);

      return {
        success: receipt.status.toString() === "SUCCESS",
        transactionId: txResponse.transactionId.toString(),
        receipt,
        recordBytes: record.contractFunctionResult?.bytes,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Contract execution failed";
      console.error(`Contract execution error (${functionName}):`, error);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Query a contract function (read operation)
   */
  async queryContract(
    contractId: string,
    functionName: string,
    functionParams: ContractFunctionParameters,
    gas: number = 100000
  ): Promise<ContractCallResult> {
    try {
      const query = new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(gas)
        .setFunction(functionName, functionParams);

      const result = await query.execute(this.client);

      return {
        success: true,
        data: result,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Contract query failed";
      console.error(`Contract query error (${functionName}):`, error);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Execute multiple contract calls in sequence
   */
  async executeBatch(
    calls: Array<{
      contractId: string;
      functionName: string;
      functionParams: ContractFunctionParameters;
      options?: TransactionOptions;
    }>
  ): Promise<TransactionResult[]> {
    const results: TransactionResult[] = [];

    for (const call of calls) {
      const result = await this.executeContract(
        call.contractId,
        call.functionName,
        call.functionParams,
        call.options
      );
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  /**
   * Estimate gas for a contract call
   */
  async estimateGas(
    contractId: string,
    functionName: string,
    functionParams: ContractFunctionParameters
  ): Promise<number> {
    try {
      // Query with low gas to get estimate
      const query = new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(50000)
        .setFunction(functionName, functionParams);

      await query.execute(this.client);

      // Return conservative estimate
      return 150000;
    } catch (error: unknown) {
      console.warn(
        `Gas estimation failed for ${functionName}, falling back to default`,
        error
      );
      // If query fails, return higher default
      return 200000;
    }
  }

  /**
   * Get contract info
   */
  async getContractInfo(contractId: string): Promise<ContractInfoResult> {
    try {
      await new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(50000)
        .setFunction(
          "supportsInterface",
          new ContractFunctionParameters().addBytes32(
            Buffer.from("01ffc9a7", "hex")
          )
        )
        .execute(this.client);

      return {
        success: true,
        contractId,
        exists: true,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Contract not accessible";
      return {
        success: false,
        contractId,
        exists: false,
        error: message,
      };
    }
  }

  /**
   * Update client (e.g., when wallet changes)
   */
  updateClient(client: Client, accountId: AccountId) {
    this.client = client;
    this.accountId = accountId;
  }

  /**
   * Get current account ID
   */
  getAccountId(): string {
    return this.accountId.toString();
  }
}
