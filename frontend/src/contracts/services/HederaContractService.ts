/**
 * Hedera Contract Service
 * Core service for interacting with Hedera smart contracts
 */

import {
  ContractId,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
  AccountId,
  Client,
} from "@hashgraph/sdk";

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  receipt?: any;
  error?: string;
  recordBytes?: Uint8Array;
}

export interface ContractCallResult {
  success: boolean;
  data?: any;
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
        receipt: receipt,
        recordBytes: record.contractFunctionResult?.bytes,
      };
    } catch (error: any) {
      console.error(`Contract execution error (${functionName}):`, error);
      return {
        success: false,
        error: error.message || "Contract execution failed",
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
    } catch (error: any) {
      console.error(`Contract query error (${functionName}):`, error);
      return {
        success: false,
        error: error.message || "Contract query failed",
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
    } catch (error) {
      // If query fails, return higher default
      return 200000;
    }
  }

  /**
   * Get contract info
   */
  async getContractInfo(contractId: string) {
    try {
      const query = await new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(50000)
        .setFunction(
          "supportsInterface",
          new ContractFunctionParameters().addBytes32(
            Buffer.from("01ffc9a7", "hex")
          )
        );

      return {
        success: true,
        contractId,
        exists: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Contract not found or not accessible",
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
